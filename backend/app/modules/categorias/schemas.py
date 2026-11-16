from pydantic import field_validator
from sqlmodel import Field, SQLModel


def _strip(v: object) -> object:
    return v.strip() if isinstance(v, str) else v


class CategoriaCreate(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)

    _strip_nombre = field_validator("nombre", mode="before")(_strip)


class CategoriaUpdate(SQLModel):
    """Actualización parcial: solo se modifican los campos enviados."""

    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)

    _strip_nombre = field_validator("nombre", mode="before")(_strip)


class CategoriaRead(SQLModel):
    id: int
    nombre: str
    descripcion: str | None
    activo: bool
