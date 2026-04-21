from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from app.models.paciente import Sexo


class PacienteCreate(BaseModel):
    nombre: str
    apellido: str
    fecha_nacimiento: date
    sexo: Sexo
    documento: Optional[str] = None
    telefono_contacto: Optional[str] = None
    observaciones: Optional[str] = None


class PacienteOut(BaseModel):
    id: int
    nombre: str
    apellido: str
    fecha_nacimiento: date
    sexo: Sexo
    documento: Optional[str]
    telefono_contacto: Optional[str]
    observaciones: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PacienteListOut(BaseModel):
    id: int
    nombre: str
    apellido: str
    fecha_nacimiento: date
    sexo: Sexo
    documento: Optional[str]

    class Config:
        from_attributes = True
