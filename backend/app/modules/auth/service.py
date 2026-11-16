from fastapi import HTTPException, status

from app.core.deps import CUENTA_DESACTIVADA
from app.core.security import create_access_token, verify_password
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.service import UsuarioDuplicado, UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class AuthService:
    """En auth se admite lanzar HTTPException desde el Service (estilo del proyecto de seguridad)."""

    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def register(self, data: UserCreate) -> UserPublic:
        try:
            return UsuarioService(self.uow).registrar(data)
        except UsuarioDuplicado as e:
            raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from e

    def login(self, username: str, password: str) -> str:
        """Valida credenciales y devuelve el JWT; el router lo coloca en la cookie HttpOnly."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            if usuario is None or not verify_password(password, usuario.hashed_password):
                raise HTTPException(
                    status.HTTP_401_UNAUTHORIZED, "Usuario o contraseña incorrectos"
                )
            if usuario.disabled:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, CUENTA_DESACTIVADA)
            return create_access_token(subject=usuario.username)


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork())
