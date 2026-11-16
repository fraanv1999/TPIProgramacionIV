from collections.abc import Callable
from types import TracebackType
from typing import Self

from sqlmodel import Session

from app.core.database import session_factory as default_session_factory


class UnitOfWork:
    """Unit of Work base.

    Abre la sesión en __enter__ y crea los repositorios que la comparten.
    En __exit__ hace commit si no hubo excepción, rollback si la hubo, y siempre close.
    Es el ÚNICO lugar de la aplicación donde se llama a session.commit().
    """

    session: Session

    def __init__(self, session_factory: Callable[[], Session] = default_session_factory) -> None:
        self._session_factory = session_factory

    def _init_repositories(self) -> None:
        """Las subclases crean aquí sus repositorios sobre self.session."""

    def __enter__(self) -> Self:
        self.session = self._session_factory()
        self._init_repositories()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            if exc_type is None:
                try:
                    self.session.commit()
                except Exception:
                    self.session.rollback()
                    raise
            else:
                self.session.rollback()
        finally:
            self.session.close()
