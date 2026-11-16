from typing import Any

from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)

    def get_for_update(self, producto_id: int) -> Producto | None:
        """Lee el producto bloqueando la fila (SELECT ... FOR UPDATE en PostgreSQL)
        para que dos pedidos simultáneos no descuenten el mismo stock."""
        return self.session.exec(
            select(Producto).where(Producto.id == producto_id).with_for_update()
        ).first()

    def search(
        self,
        *,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[int, list[Producto]]:
        """Listado paginado de productos activos con búsqueda por nombre y filtros."""
        condiciones: list[Any] = [col(Producto.activo).is_(True)]
        if search:
            condiciones.append(col(Producto.nombre).ilike(f"%{search.strip()}%"))
        if categoria_id is not None:
            condiciones.append(Producto.categoria_id == categoria_id)
        if disponible is not None:
            condiciones.append(col(Producto.disponible).is_(disponible))

        total = self.session.exec(
            select(func.count()).select_from(Producto).where(*condiciones)
        ).one()
        items = self.session.exec(
            select(Producto)
            .where(*condiciones)
            .order_by(col(Producto.nombre))
            .offset(skip)
            .limit(limit)
        ).all()
        return total, list(items)
