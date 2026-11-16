from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository
from app.modules.productos.repository import ProductoRepository


class ProductoUnitOfWork(UnitOfWork):
    """Expone productos y categorías (para validar la categoría al crear/actualizar)."""

    productos: ProductoRepository
    categorias: CategoriaRepository

    def _init_repositories(self) -> None:
        self.productos = ProductoRepository(self.session)
        self.categorias = CategoriaRepository(self.session)
