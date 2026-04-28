from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Enum as SAEnum, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class NivelTriaje(int, enum.Enum):
    emergencia = 1
    muy_urgente = 2
    urgente = 3
    menor_urgencia = 4
    no_urgente = 5


class NivelConciencia(str, enum.Enum):
    alerta = "alerta"
    voz = "voz"
    dolor = "dolor"
    inconsciente = "inconsciente"


class TipoAccion(str, enum.Enum):
    analgesico = "analgesico"
    antipiretico = "antipiretico"
    sro = "sro"
    oxigeno = "oxigeno"
    inmovilizacion = "inmovilizacion"
    limpieza_herida = "limpieza_herida"
    otro = "otro"


class Triaje(Base):
    __tablename__ = "triajes"

    id = Column(Integer, primary_key=True, index=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    motivo_consulta = Column(Text, nullable=False)
    nivel = Column(SAEnum(NivelTriaje), nullable=True)
    tiempo_espera_minutos = Column(Integer, nullable=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    completado = Column(Boolean, default=False)

    paciente = relationship("Paciente", back_populates="triajes")
    usuario = relationship("User")
    signos_vitales = relationship("SignosVitales", back_populates="triaje", uselist=False)
    evaluacion_tep = relationship("EvaluacionTEP", back_populates="triaje", uselist=False)
    factores_riesgo = relationship("FactoresRiesgo", back_populates="triaje", uselist=False)
    evaluacion_sepsis = relationship("EvaluacionSepsis", back_populates="triaje", uselist=False)
    acciones = relationship("AccionTriaje", back_populates="triaje", order_by="AccionTriaje.hora_administracion")


class SignosVitales(Base):
    __tablename__ = "signos_vitales"

    id = Column(Integer, primary_key=True, index=True)
    triaje_id = Column(Integer, ForeignKey("triajes.id"), nullable=False)

    frecuencia_cardiaca = Column(Integer, nullable=True)       # lpm
    frecuencia_respiratoria = Column(Integer, nullable=True)   # rpm
    temperatura = Column(Float, nullable=True)                 # Celsius
    saturacion_o2 = Column(Integer, nullable=True)             # %
    tension_arterial_sistolica = Column(Integer, nullable=True)
    tension_arterial_diastolica = Column(Integer, nullable=True)
    nivel_conciencia = Column(SAEnum(NivelConciencia), nullable=True)
    glasgow = Column(Integer, nullable=True)                   # 3-15
    peso_kg = Column(Float, nullable=True)
    llene_capilar_segundos = Column(Float, nullable=True)

    triaje = relationship("Triaje", back_populates="signos_vitales")


class EvaluacionTEP(Base):
    """Triangulo de Evaluacion Pediatrica"""
    __tablename__ = "evaluaciones_tep"

    id = Column(Integer, primary_key=True, index=True)
    triaje_id = Column(Integer, ForeignKey("triajes.id"), nullable=False)

    # Apariencia: tono, interaccion, consuelo, mirada, habla/llanto
    apariencia_normal = Column(Boolean, nullable=False, default=True)
    apariencia_detalle = Column(Text, nullable=True)

    # Respiracion: sonidos, posicion, retraccion, aleteo nasal
    respiracion_normal = Column(Boolean, nullable=False, default=True)
    respiracion_detalle = Column(Text, nullable=True)

    # Circulacion: color de piel, hemorragia visible
    circulacion_normal = Column(Boolean, nullable=False, default=True)
    circulacion_detalle = Column(Text, nullable=True)

    triaje = relationship("Triaje", back_populates="evaluacion_tep")


class FactoresRiesgo(Base):
    __tablename__ = "factores_riesgo"

    id = Column(Integer, primary_key=True, index=True)
    triaje_id = Column(Integer, ForeignKey("triajes.id"), nullable=False)

    edad_menor_3_meses = Column(Boolean, default=False)
    inmunosupresion = Column(Boolean, default=False)
    enfermedad_cronica = Column(Boolean, default=False)
    reconsulta_72h = Column(Boolean, default=False)
    dolor_severo = Column(Boolean, default=False)
    sospecha_infeccion = Column(Boolean, default=False)  # usado en criterios SIRS

    triaje = relationship("Triaje", back_populates="factores_riesgo")


class AccionTriaje(Base):
    __tablename__ = "acciones_triaje"

    id = Column(Integer, primary_key=True, index=True)
    triaje_id = Column(Integer, ForeignKey("triajes.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tipo_accion = Column(SAEnum(TipoAccion), nullable=False)
    detalle = Column(Text, nullable=True)
    dosis = Column(String(100), nullable=True)
    hora_administracion = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    triaje = relationship("Triaje", back_populates="acciones")
    usuario = relationship("User")
