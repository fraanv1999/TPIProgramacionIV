from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository

COOKIE_NAME = "access_token"
CUENTA_DESACTIVADA = "Cuenta de usuario desactivada"


def get_current_user(request: Request, session: Session = Depends(get_session)) -> Usuario:
    """Lee el JWT de la cookie HttpOnly, valida firma y expiración y carga el usuario."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado o sesión vencida",
    )
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise credentials_exception
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    username = payload.get("sub")
    if not isinstance(username, str):
        raise credentials_exception
    usuario = UsuarioRepository(session).get_by_username(username)
    if usuario is None:
        raise credentials_exception
    return usuario


def get_current_active_user(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    if usuario.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=CUENTA_DESACTIVADA)
    return usuario


def require_role(roles: list[str]) -> Callable[[Usuario], Usuario]:
    def checker(usuario: Usuario = Depends(get_current_active_user)) -> Usuario:
        if usuario.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para realizar esta acción",
            )
        return usuario

    return checker
