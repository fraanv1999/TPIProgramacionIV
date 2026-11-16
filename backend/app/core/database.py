from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

_connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=_connect_args, pool_pre_ping=True)


def import_models() -> None:
    """Importa todos los modelos para registrar las tablas y resolver las relaciones."""
    from app.modules.categorias import models as _categorias  # noqa: F401
    from app.modules.pedidos import models as _pedidos  # noqa: F401
    from app.modules.productos import models as _productos  # noqa: F401
    from app.modules.usuarios import models as _usuarios  # noqa: F401


def create_all_tables() -> None:
    import_models()
    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    """Crea una sesión nueva. expire_on_commit=False permite leer los objetos tras el commit."""
    return Session(engine, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    """Sesión por request, usada por las dependencias de autenticación."""
    with session_factory() as session:
        yield session
