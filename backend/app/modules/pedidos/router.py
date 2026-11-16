from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_active_user, require_role
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ReglaDeNegocio,
    get_pedido_service,
)
from app.modules.productos.service import ProductoNoEncontrado
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

solo_admin = require_role(["admin"])


def _traducir(e: Exception) -> HTTPException:
    """Traduce las excepciones de dominio a códigos HTTP."""
    if isinstance(e, (PedidoNoEncontrado, ProductoNoEncontrado)):
        return HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    if isinstance(e, PedidoAjeno):
        return HTTPException(status.HTTP_403_FORBIDDEN, str(e))
    return HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


_ERRORES_DOMINIO = (PedidoNoEncontrado, ProductoNoEncontrado, PedidoAjeno, ReglaDeNegocio)


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def crear_pedido(
    data: PedidoCreate,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.crear(data, usuario)
    except _ERRORES_DOMINIO as e:
        raise _traducir(e) from e


@router.get("", response_model=PedidosPaginados)
def listar_pedidos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    estado: EstadoPedido | None = Query(None),
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidosPaginados:
    return service.listar(usuario, estado=estado, skip=skip, limit=limit)


# Se declara antes de /{pedido_id} para que "resumen" no se interprete como id.
@router.get("/resumen", response_model=ResumenPedidos)
def resumen_pedidos(
    _: Usuario = Depends(solo_admin),
    service: PedidoService = Depends(get_pedido_service),
) -> ResumenPedidos:
    return service.resumen()


@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener_pedido(
    pedido_id: int,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.obtener(pedido_id, usuario)
    except _ERRORES_DOMINIO as e:
        raise _traducir(e) from e


@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
def cambiar_estado_pedido(
    pedido_id: int,
    data: CambioEstado,
    _: Usuario = Depends(solo_admin),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.cambiar_estado(pedido_id, data.estado)
    except _ERRORES_DOMINIO as e:
        raise _traducir(e) from e


@router.patch("/{pedido_id}/cancelar", response_model=PedidoRead)
def cancelar_pedido(
    pedido_id: int,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.cancelar(pedido_id, usuario)
    except _ERRORES_DOMINIO as e:
        raise _traducir(e) from e
