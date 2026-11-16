# Food Store — TPI Programación 4

Aplicación web para un negocio de comidas: los clientes se registran, recorren el catálogo, arman un carrito y confirman pedidos; el administrador gestiona categorías, productos, stock, pedidos y usuarios.

- **Backend:** FastAPI + SQLModel, arquitectura en capas con Unit of Work, JWT en cookie HttpOnly, roles `user` / `admin`.
- **Frontend:** React 19 + TypeScript + Vite, Tailwind CSS 4, TanStack Query / Form / Table, Zustand, Axios, React Router.

**Repositorio:** https://github.com/fraanv1999/TPIProgramacionIV

**Video de demostración:** https://youtu.be/Fng8hYtaouc

---

## Requisitos

| Herramienta | Versión |
|---|---|
| Python | 3.11 a 3.13 (SQLModel 0.0.22 no funciona con 3.14) |
| Node.js | 20.19 o superior |
| pnpm | 9 o superior (`npm install -g pnpm`) |
| PostgreSQL | 15 o superior (opcional: para desarrollo se puede usar SQLite) |

## Estructura

```
.
├── backend/            API REST (FastAPI)
│   ├── app/
│   │   ├── main.py     App, CORS con credenciales y routers bajo /api/v1
│   │   ├── core/       config, database, security, deps, unit_of_work, base_repository
│   │   ├── modules/    auth, usuarios, categorias, productos, pedidos
│   │   │               (models, schemas, repository, unit_of_work, service, router)
│   │   └── db/seed.py  Seed idempotente
│   ├── requirements.txt
│   └── .env.example
└── frontend/           SPA React organizada por features
    ├── src/
    │   ├── shared/     api (axios, errores, queryClient), ui, components, layout
    │   ├── features/   auth, categorias, productos, usuarios, pedidos
    │   │               (pages, components, hooks, api, types)
    │   ├── store/      authStore y cartStore (Zustand + persist)
    │   └── routes/     AppRouter y ProtectedRoute
    ├── package.json
    └── .env.example
```

---

## Backend

### Instalación

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # en Windows (cmd): copy .env.example .env
```

Editar `backend/.env`:

- **Con PostgreSQL:** crear la base (`CREATE DATABASE foodstore_db;`) y ajustar usuario y contraseña en `DATABASE_URL`.
- **Con SQLite (más rápido para probar):** comentar la línea de PostgreSQL y descomentar `DATABASE_URL=sqlite:///./foodstore.db`.
- Cambiar `SECRET_KEY` por una clave propia de **al menos 32 caracteres**.

### Ejecución

```bash
python -m app.db.seed           # crea las tablas y carga los datos iniciales (idempotente)
uvicorn app.main:app --reload   # http://localhost:8000
```

Documentación de la API: <http://localhost:8000/docs> (Swagger) y <http://localhost:8000/redoc>.

### Variables de entorno (`backend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a la base | `postgresql://user:pass@localhost:5432/foodstore_db` o `sqlite:///./foodstore.db` |
| `SECRET_KEY` | Firma del JWT (mínimo 32 caracteres) | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token y de la cookie | `30` |
| `FRONTEND_ORIGIN` | Origen permitido en CORS | `http://localhost:5173` |
| `COOKIE_SECURE` | `true` solo si se sirve por HTTPS | `false` |

### Usuario del seed

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin1234!` | admin |

El seed también crea 5 categorías y 10 productos con stock. Los clientes se crean desde la pantalla de registro.

---

## Frontend

### Instalación y ejecución

```bash
cd frontend
cp .env.example .env        # en Windows (cmd): copy .env.example .env
pnpm install
pnpm build                  # verifica los tipos (tsc) y genera dist/
pnpm dev                    # http://localhost:5173
```

### Variables de entorno (`frontend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `http://localhost:8000/api/v1` |

> **Importante:** abrir el frontend en `http://localhost:5173` (no en `127.0.0.1`). La cookie de sesión es `SameSite=Lax`, y frontend y backend tienen que estar en el mismo host (`localhost`) para que el navegador la envíe.

---

## Funcionalidades

### Cliente (`user`)
- Registro e inicio de sesión (TanStack Form con validación).
- Catálogo paginado en el servidor, con búsqueda por nombre, filtro por categoría, skeleton de carga y estado vacío.
- Carrito persistido en el navegador (Zustand + `persist`).
- Checkout con dirección de entrega, forma de pago (efectivo / transferencia) y notas.
- «Mis pedidos»: listado, detalle y cancelación mientras el pedido está en `PENDIENTE`.

### Administrador (`admin`)
- Resumen con tarjetas: pendientes, en preparación, entregados, cancelados, pedidos de hoy e ingresos entregados.
- ABM de categorías y productos con TanStack Table y TanStack Form, incluido el cambio de stock y disponibilidad.
- Gestión de pedidos con filtro por estado y botones según la máquina de estados.
- Gestión de usuarios: activar y desactivar (no puede desactivarse a sí mismo).

### Reglas de negocio
| Regla | Implementación |
|---|---|
| RN-01 Crear pedido | Al menos un ítem, sin productos repetidos; cada producto activo, disponible y con stock. El stock se descuenta y las líneas se crean en **una sola transacción** (`PedidoUnitOfWork`). Si algo falla, rollback total. |
| RN-02 Transiciones | `PENDIENTE → EN_PREPARACION / CANCELADO`, `EN_PREPARACION → ENTREGADO / CANCELADO`; `ENTREGADO` y `CANCELADO` son terminales. Una transición inválida responde 400. |
| RN-03 Cancelar | Restituye el stock en la misma transacción que cambia el estado. |
| RN-04 Permisos | El cliente ve y cancela solo sus pedidos (y solo en `PENDIENTE`); el admin ve todos y avanza o cancela. |
| RN-05 Inmutabilidad | Las líneas copian `nombre_producto` y `precio_unitario`; no hay endpoints para editar ni borrar pedidos. |
| RN-06 Datos del pedido | `forma_pago` ∈ {`EFECTIVO`, `TRANSFERENCIA`}; `direccion_entrega` de 5 a 200 caracteres (validado en el schema). |

### Arquitectura del backend
`Router → Service → UnitOfWork → Repository → Model`. El commit se hace únicamente en el `__exit__` del Unit of Work (rollback si hubo excepción y close siempre). Los Services abren `with self.uow as uow:` y devuelven el schema de salida dentro del bloque; los Routers obtienen el Service con `Depends(get_<modulo>_service)`, traducen las excepciones de dominio a `HTTPException` y nunca abren el Unit of Work.

### Sesión en el frontend
- El JWT viaja **solo** en la cookie HttpOnly `access_token`; el frontend nunca lo lee ni lo guarda.
- `authStore` persiste solo los datos públicos del `usuario` (`partialize`) y `checkSession` llama a `/auth/me` al montar la app.
- Axios usa `withCredentials: true`. El interceptor limpia la sesión ante un 401 (salvo en `/auth/token` y `/auth/me`) o ante «Cuenta de usuario desactivada»; `ProtectedRoute` redirige entonces a `/login`.
