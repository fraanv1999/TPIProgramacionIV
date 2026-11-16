from app.core.security import hash_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


# ---------- Excepciones de dominio ----------
class UsuarioNoEncontrado(Exception):
    def __init__(self, usuario_id: int) -> None:
        super().__init__(f"Usuario {usuario_id} no encontrado")


class UsuarioDuplicado(Exception):
    pass


class AutoDesactivacion(Exception):
    def __init__(self) -> None:
        super().__init__("Un administrador no puede desactivarse a sí mismo")


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def registrar(self, data: UserCreate) -> UserPublic:
        """Registro público: siempre crea usuarios con rol 'user'."""
        with self.uow as uow:
            if uow.usuarios.get_by_username(data.username):
                raise UsuarioDuplicado("El nombre de usuario ya está registrado")
            if uow.usuarios.get_by_email(data.email):
                raise UsuarioDuplicado("El email ya está registrado")
            usuario = Usuario(
                username=data.username,
                full_name=data.full_name,
                email=data.email.lower(),
                hashed_password=hash_password(data.password),
                role="user",
            )
            uow.usuarios.add(usuario)
            return UserPublic.model_validate(usuario)

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.list_ordenados()]

    def activar(self, usuario_id: int) -> UserPublic:
        """Alta lógica. Idempotente: responde OK aunque ya esté activo."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise UsuarioNoEncontrado(usuario_id)
            usuario.disabled = False
            uow.session.add(usuario)
            return UserPublic.model_validate(usuario)

    def desactivar(self, usuario_id: int, actual: Usuario) -> UserPublic:
        """Baja lógica. Idempotente. Un admin no puede desactivarse a sí mismo."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise UsuarioNoEncontrado(usuario_id)
            if usuario.id == actual.id:
                raise AutoDesactivacion()
            usuario.disabled = True
            uow.session.add(usuario)
            return UserPublic.model_validate(usuario)


def get_usuario_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())
