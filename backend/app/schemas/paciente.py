from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from app.models.paciente import Sexo

GRUPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]


class AntecedentesBase(BaseModel):
    grupo_sanguineo: Optional[str] = None
    alergias: Optional[str] = None
    enfermedades_cronicas: Optional[str] = None
    medicacion_habitual: Optional[str] = None
    antecedentes_quirurgicos: Optional[str] = None


class PacienteCreate(AntecedentesBase):
    nombre: str
    apellido: str
    fecha_nacimiento: date
    sexo: Sexo
    documento: Optional[str] = None
    telefono_contacto: Optional[str] = None
    observaciones: Optional[str] = None


class PacienteUpdate(AntecedentesBase):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[Sexo] = None
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
    grupo_sanguineo: Optional[str]
    alergias: Optional[str]
    enfermedades_cronicas: Optional[str]
    medicacion_habitual: Optional[str]
    antecedentes_quirurgicos: Optional[str]
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
    grupo_sanguineo: Optional[str]
    alergias: Optional[str]

    class Config:
        from_attributes = True
