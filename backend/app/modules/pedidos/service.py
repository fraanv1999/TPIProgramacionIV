from datetime import datetime

from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado
from app.modules.usuarios.models import Usuario

# ---------- Máquina de estados (RN-02) ----------
TRANSICIONES: dict[EstadoPedido, set[EstadoPedido]] = {
    EstadoPedido.PENDIENTE: {EstadoPedido.EN_PREPARACION, EstadoPedido.CANCELADO},
    EstadoPedido.EN_PREPARACION: {EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO},
    EstadoPedido.ENTREGADO: set(),  # terminal
    EstadoPedido.CANCELADO: set(),  # terminal
}


# ---------- Excepciones de dominio ----------
class PedidoNoEncontrado(Exception):  # 404
    def __init__(self, pedido_id: int) -> None:
        super().__init__(f"Pedido {pedido_id} no encontrado")


class PedidoAjeno(Exception):  # 403
    def __init__(self) -> None:
        super().__init__("El pedido pertenece a otro usuario")


class ReglaDeNegocio(Exception):  # 400
    """Base de las violaciones de reglas de negocio."""


class StockInsuficiente(ReglaDeNegocio):
    def __init__(self, nombre: str, disponible: int, pedido: int) -> None:
        super().__init__(
            f"Stock insuficiente para '{nombre}': disponible {disponible}, solicitado {pedido}"
        )


class ProductoNoDisponible(ReglaDeNegocio):
    def __init__(self, nombre: str) -> None:
        super().__init__(f"El producto '{nombre}' no está disponible")


class ProductoRepetido(ReglaDeNegocio):
    def __init__(self, producto_id: int) -> None:
        super().__init__(f"El producto {producto_id} está repetido en el pedido")


class TransicionInvalida(ReglaDeNegocio):
    def __init__(self, actual: str, nuevo: str) -> None:
        super().__init__(f"Transición inválida: {actual} → {nuevo}")


class PedidoNoCancelable(ReglaDeNegocio):
    def __init__(self, estado: str) -> None:
        super().__init__(
            f"Solo se pueden cancelar pedidos en PENDIENTE (estado actual: {estado})"
        )


def _es_admin(usuario: Usuario) -> bool:
    return usuario.role == "admin"


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    # ----- helpers -----
    @staticmethod
    def _get_pedido(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado(pedido_id)
        return pedido

    @staticmethod
    def _restituir_stock(uow: PedidoUnitOfWork, pedido: Pedido) -> None:
        """RN-03: devuelve al stock las cantidades de cada línea."""
        for item in pedido.items:
            producto = uow.productos.get_for_update(item.producto_id)
            if producto is not None:
                producto.stock += item.cantidad
                uow.session.add(producto)

    # ----- casos de uso -----
    def crear(self, data: PedidoCreate, usuario: Usuario) -> PedidoRead:
        """RN-01: todo en una transacción; si algo falla, el UoW hace rollback."""
        with self.uow as uow:
            ids = [item.producto_id for item in data.items]
            vistos: set[int] = set()
            for producto_id in ids:
                if producto_id in vistos:
                    raise ProductoRepetido(producto_id)
                vistos.add(producto_id)

            assert usuario.id is not None
            pedido = uow.pedidos.add(
                Pedido(
                    usuario_id=usuario.id,
                    estado=EstadoPedido.PENDIENTE.value,
                    forma_pago=data.forma_pago.value,
                    direccion_entrega=data.direccion_entrega,
                    notas=data.notas,
                    total=0,
                )
            )
            assert pedido.id is not None

            total = 0.0
            for item in data.items:
                producto = uow.productos.get_for_update(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(item.producto_id)
                if not producto.disponible:
                    raise ProductoNoDisponible(producto.nombre)
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(producto.nombre, producto.stock, item.cantidad)

                producto.stock -= item.cantidad
                uow.session.add(producto)

                subtotal = round(producto.precio_base * item.cantidad, 2)
                uow.pedidos.add_detalle(
                    DetallePedido(
                        pedido_id=pedido.id,
                        producto_id=item.producto_id,
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,  # copia (RN-05)
                        precio_unitario=producto.precio_base,  # copia (RN-05)
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            uow.session.add(pedido)
            uow.session.flush()
            uow.session.refresh(pedido)
            return PedidoRead.model_validate(pedido)

    def listar(
        self, usuario: Usuario, *, estado: EstadoPedido | None, skip: int, limit: int
    ) -> PedidosPaginados:
        """RN-04: el admin ve todos; el cliente, solo los propios."""
        with self.uow as uow:
            filtro = estado.value if estado else None
            if _es_admin(usuario):
                total, items = uow.pedidos.list_todos(estado=filtro, skip=skip, limit=limit)
            else:
                assert usuario.id is not None
                total, items = uow.pedidos.list_by_usuario(
                    usuario.id, estado=filtro, skip=skip, limit=limit
                )
            return PedidosPaginados(
                total=total, items=[PedidoRead.model_validate(p) for p in items]
            )

    def obtener(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get_pedido(uow, pedido_id)
            if not _es_admin(usuario) and pedido.usuario_id != usuario.id:
                raise PedidoAjeno()
            return PedidoRead.model_validate(pedido)

    def cambiar_estado(self, pedido_id: int, nuevo: EstadoPedido) -> PedidoRead:
        """Solo admin. RN-02 (transiciones) y RN-03 (restituir stock al cancelar)."""
        with self.uow as uow:
            pedido = self._get_pedido(uow, pedido_id)
            actual = EstadoPedido(pedido.estado)
            if nuevo not in TRANSICIONES[actual]:
                raise TransicionInvalida(actual.value, nuevo.value)
            if nuevo == EstadoPedido.CANCELADO:
                self._restituir_stock(uow, pedido)
            pedido.estado = nuevo.value
            pedido.updated_at = datetime.now()
            uow.session.add(pedido)
            uow.session.flush()
            return PedidoRead.model_validate(pedido)

    def cancelar(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        """El dueño cancela su pedido solo en PENDIENTE (RN-03, RN-04)."""
        with self.uow as uow:
            pedido = self._get_pedido(uow, pedido_id)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno()
            if pedido.estado != EstadoPedido.PENDIENTE.value:
                raise PedidoNoCancelable(pedido.estado)
            self._restituir_stock(uow, pedido)
            pedido.estado = EstadoPedido.CANCELADO.value
            pedido.updated_at = datetime.now()
            uow.session.add(pedido)
            uow.session.flush()
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            conteos = uow.pedidos.count_by_estado()
            inicio_hoy = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            return ResumenPedidos(
                pendientes=conteos.get(EstadoPedido.PENDIENTE.value, 0),
                en_preparacion=conteos.get(EstadoPedido.EN_PREPARACION.value, 0),
                entregados=conteos.get(EstadoPedido.ENTREGADO.value, 0),
                cancelados=conteos.get(EstadoPedido.CANCELADO.value, 0),
                pedidos_hoy=uow.pedidos.count_desde(inicio_hoy),
                ingresos_entregados=round(
                    uow.pedidos.sum_total_by_estado(EstadoPedido.ENTREGADO.value), 2
                ),
            )


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())
