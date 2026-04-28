from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import Base, engine, SessionLocal
from app.routers import auth, pacientes, triaje

# Crear tablas al iniciar (en produccion usar Alembic)
Base.metadata.create_all(bind=engine)


def _seed_admin() -> None:
    """Crea el usuario admin inicial si no existe ningún admin en la DB."""
    from app.models.user import User, RolUsuario
    from app.services.auth_service import hash_password

    db = SessionLocal()
    try:
        existe = db.query(User).filter(User.rol == RolUsuario.admin).first()
        if not existe:
            admin = User(
                nombre=settings.ADMIN_NOMBRE,
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                rol=RolUsuario.admin,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


_seed_admin()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(pacientes.router)
app.include_router(triaje.router)


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "sistema": settings.PROJECT_NAME, "version": settings.VERSION}
