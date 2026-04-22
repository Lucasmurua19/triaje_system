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


class EscalaDolor(str, enum.Enum):
    nips = "nips"           # neonatos < 1 mes (0-7)
    flacc = "flacc"         # 1 mes - 3 años (0-10)
    wong_baker = "wong_baker"  # 3-7 años (0-10, caras)
    numerica = "numerica"   # > 7 años (0-10)


class EstadoHidratacion(str, enum.Enum):
    normohidratado = "normohidratado"
    deshidratacion_leve = "deshidratacion_leve"
    deshidratacion_moderada = "deshidratacion_moderada"
    no_aplica = "no_aplica"


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
    es_fast_track = Column(Boolean, default=False)
    estado_hidratacion = Column(SAEnum(EstadoHidratacion), nullable=True)

    paciente = relationship("Paciente", back_populates="triajes")
    usuario = relationship("User")
    signos_vitales = relationship("SignosVitales", back_populates="triaje", uselist=False)
    evaluacion_tep = relationship("EvaluacionTEP", back_populates="triaje", uselist=False)
    factores_riesgo = relationship("FactoresRiesgo", back_populates="triaje", uselist=False)
    evaluacion_sepsis = relationship("EvaluacionSepsis", back_populates="triaje", uselist=False)


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
    escala_dolor = Column(SAEnum(EscalaDolor), nullable=True)
    score_dolor = Column(Integer, nullable=True)               # 0-10 (NIPS: 0-7)

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
