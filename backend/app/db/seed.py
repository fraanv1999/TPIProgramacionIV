"""Seed idempotente: python -m app.db.seed

Crea (solo si no existen) el usuario admin, categorías y productos con stock.
Se puede ejecutar varias veces sin duplicar datos.
"""

from sqlmodel import Session, select

from app.core.database import create_all_tables, session_factory
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

ADMIN = {
    "username": "admin",
    "full_name": "Administrador",
    "email": "admin@foodstore.com",
    "password": "Admin1234!",
}

CATEGORIAS: list[dict[str, str]] = [
    {"nombre": "Hamburguesas", "descripcion": "Hamburguesas caseras con papas"},
    {"nombre": "Pizzas", "descripcion": "Pizzas a la piedra"},
    {"nombre": "Ensaladas", "descripcion": "Opciones frescas y livianas"},
    {"nombre": "Bebidas", "descripcion": "Gaseosas, jugos y aguas"},
    {"nombre": "Postres", "descripcion": "Para terminar con algo dulce"},
]

IMG = "https://images.unsplash.com/{}?w=600&auto=format&fit=crop&q=60"

PRODUCTOS: list[dict[str, str | float | int]] = [
    {"categoria": "Hamburguesas", "nombre": "Hamburguesa Clásica", "precio_base": 8500,
     "stock": 30, "descripcion": "Medallón de carne, lechuga, tomate y queso cheddar.",
     "imagen_url": IMG.format("photo-1568901346375-23c9450c58cd")},
    {"categoria": "Hamburguesas", "nombre": "Hamburguesa Doble Bacon", "precio_base": 11200,
     "stock": 20, "descripcion": "Doble medallón, doble cheddar y panceta crocante.",
     "imagen_url": IMG.format("photo-1571091718767-18b5b1457add")},
    {"categoria": "Pizzas", "nombre": "Pizza Muzzarella", "precio_base": 9800,
     "stock": 25, "descripcion": "Salsa de tomate, muzzarella y aceitunas.",
     "imagen_url": IMG.format("photo-1513104890138-7c749659a591")},
    {"categoria": "Pizzas", "nombre": "Pizza Napolitana", "precio_base": 10900,
     "stock": 15, "descripcion": "Muzzarella, rodajas de tomate, ajo y orégano.",
     "imagen_url": IMG.format("photo-1565299624946-b28f40a0ae38")},
    {"categoria": "Ensaladas", "nombre": "Ensalada César", "precio_base": 7200,
     "stock": 18, "descripcion": "Lechuga, pollo grillado, croutons y aderezo César.",
     "imagen_url": IMG.format("photo-1546069901-ba9599a7e63c")},
    {"categoria": "Ensaladas", "nombre": "Bowl Veggie", "precio_base": 6900,
     "stock": 12, "descripcion": "Quinoa, palta, garbanzos y vegetales asados.",
     "imagen_url": IMG.format("photo-1512621776951-a57141f2eefd")},
    {"categoria": "Bebidas", "nombre": "Gaseosa Cola 500 ml", "precio_base": 2200,
     "stock": 60, "descripcion": "Bebida gaseosa fría.",
     "imagen_url": IMG.format("photo-1554866585-cd94860890b7")},
    {"categoria": "Bebidas", "nombre": "Jugo de Naranja", "precio_base": 2800,
     "stock": 40, "descripcion": "Exprimido en el momento.",
     "imagen_url": IMG.format("photo-1600271886742-f049cd451bba")},
    {"categoria": "Postres", "nombre": "Brownie con Helado", "precio_base": 5200,
     "stock": 15, "descripcion": "Brownie tibio con bocha de helado de vainilla.",
     "imagen_url": IMG.format("photo-1564355808539-22fda35bed7e")},
    {"categoria": "Postres", "nombre": "Helado 1/4 kg", "precio_base": 4800,
     "stock": 20, "descripcion": "Dos gustos a elección.",
     "imagen_url": IMG.format("photo-1563805042-7684c019e1cb")},
]


def seed_admin(session: Session) -> None:
    existe = session.exec(select(Usuario).where(Usuario.username == ADMIN["username"])).first()
    if existe:
        print("  = admin ya existe")
        return
    session.add(
        Usuario(
            username=ADMIN["username"],
            full_name=ADMIN["full_name"],
            email=ADMIN["email"],
            hashed_password=hash_password(ADMIN["password"]),
            role="admin",
        )
    )
    print("  + admin creado (admin / Admin1234!)")


def seed_categorias(session: Session) -> dict[str, Categoria]:
    por_nombre: dict[str, Categoria] = {}
    for data in CATEGORIAS:
        categoria = session.exec(select(Categoria).where(Categoria.nombre == data["nombre"])).first()
        if categoria is None:
            categoria = Categoria(**data)
            session.add(categoria)
            session.flush()
            print(f"  + categoría {data['nombre']}")
        por_nombre[data["nombre"]] = categoria
    return por_nombre


def seed_productos(session: Session, categorias: dict[str, Categoria]) -> None:
    for data in PRODUCTOS:
        nombre = str(data["nombre"])
        if session.exec(select(Producto).where(Producto.nombre == nombre)).first():
            continue
        categoria = categorias[str(data["categoria"])]
        assert categoria.id is not None
        session.add(
            Producto(
                categoria_id=categoria.id,
                nombre=nombre,
                descripcion=str(data["descripcion"]),
                precio_base=float(data["precio_base"]),
                imagen_url=str(data["imagen_url"]),
                stock=int(data["stock"]),
            )
        )
        print(f"  + producto {nombre}")


def main() -> None:
    print("Creando tablas...")
    create_all_tables()
    print("Cargando datos iniciales...")
    with session_factory() as session:
        seed_admin(session)
        categorias = seed_categorias(session)
        seed_productos(session, categorias)
        session.commit()
    print("Seed finalizado.")


if __name__ == "__main__":
    main()
