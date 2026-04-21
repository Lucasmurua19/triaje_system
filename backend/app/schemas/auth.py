from pydantic import BaseModel, EmailStr
from app.models.user import RolUsuario


class UserCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    rol: RolUsuario = RolUsuario.enfermera


class UserOut(BaseModel):
    id: int
    nombre: str
    email: str
    rol: RolUsuario
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginForm(BaseModel):
    email: str
    password: str
