from sqlalchemy import Column, Integer, String, Date, Enum as SAEnum, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class Sexo(str, enum.Enum):
    masculino = "masculino"
    femenino = "femenino"


class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    sexo = Column(SAEnum(Sexo), nullable=False)
    documento = Column(String(20), unique=True, index=True, nullable=True)
    telefono_contacto = Column(String(20), nullable=True)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Antecedentes médicos
    grupo_sanguineo = Column(String(5), nullable=True)
    alergias = Column(Text, nullable=True)
    enfermedades_cronicas = Column(Text, nullable=True)
    medicacion_habitual = Column(Text, nullable=True)
    antecedentes_quirurgicos = Column(Text, nullable=True)

    triajes = relationship("Triaje", back_populates="paciente")
