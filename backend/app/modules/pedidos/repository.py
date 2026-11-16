from datetime import datetime
from typing import Any

from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def add_detalle(self, detalle: DetallePedido) -> DetallePedido:
        self.session.add(detalle)
        return detalle

    def _paginar(
        self, condiciones: list[Any], skip: int, limit: int
    ) -> tuple[int, list[Pedido]]:
        total = self.session.exec(
            select(func.count()).select_from(Pedido).where(*condiciones)
        ).one()
        items = self.session.exec(
            select(Pedido)
            .where(*condiciones)
            .order_by(col(Pedido.created_at).desc(), col(Pedido.id).desc())
            .offset(skip)
            .limit(limit)
        ).all()
        return total, list(items)

    def list_by_usuario(
        self, usuario_id: int, *, estado: str | None = None, skip: int = 0, limit: int = 20
    ) -> tuple[int, list[Pedido]]:
        condiciones: list[Any] = [Pedido.usuario_id == usuario_id]
        if estado:
            condiciones.append(Pedido.estado == estado)
        return self._paginar(condiciones, skip, limit)

    def list_todos(
        self, *, estado: str | None = None, skip: int = 0, limit: int = 20
    ) -> tuple[int, list[Pedido]]:
        condiciones: list[Any] = []
        if estado:
            condiciones.append(Pedido.estado == estado)
        return self._paginar(condiciones, skip, limit)

    def count_by_estado(self) -> dict[str, int]:
        filas = self.session.exec(
            select(Pedido.estado, func.count(col(Pedido.id))).group_by(Pedido.estado)
        ).all()
        return {estado: cantidad for estado, cantidad in filas}

    def count_desde(self, desde: datetime) -> int:
        return self.session.exec(
            select(func.count(col(Pedido.id))).where(Pedido.created_at >= desde)
        ).one()

    def sum_total_by_estado(self, estado: str) -> float:
        valor = self.session.exec(
            select(func.coalesce(func.sum(Pedido.total), 0)).where(Pedido.estado == estado)
        ).one()
        return float(valor)
