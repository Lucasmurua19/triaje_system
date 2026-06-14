from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class NivelSepsis(str, enum.Enum):
    sin_sepsis = "sin_sepsis"
    sospecha = "sospecha"         # 2+ criterios SIRS + infeccion sospechada
    sepsis_grave = "sepsis_grave" # sepsis + disfuncion organica
    shock_septico = "shock_septico"


class ClasificacionShock(str, enum.Enum):
    compensado = "compensado"
    descompensado = "descompensado"
    refractario = "refractario"


class EvaluacionSepsis(Base):
    __tablename__ = "evaluaciones_sepsis"

    id = Column(Integer, primary_key=True, index=True)
    triaje_id = Column(Integer, ForeignKey("triajes.id"), nullable=False)

    # Criterios SIRS pediatricos evaluados
    criterio_temperatura = Column(Boolean, default=False)      # Fiebre >38.5 o hipotermia <36
    criterio_taquicardia = Column(Boolean, default=False)      # FC >2DS para edad
    criterio_taquipnea = Column(Boolean, default=False)        # FR >2DS para edad
    criterio_leucocitos = Column(Boolean, default=False)       # Leucocitosis/leucopenia (si disponible)
    criterio_mental = Column(Boolean, default=False)           # Alteracion de conciencia
    criterio_perfusion = Column(Boolean, default=False)        # Llene capilar >2s o piel moteada

    total_criterios_sirs = Column(Integer, default=0)

    # Clasificacion final
    nivel = Column(SAEnum(NivelSepsis), default=NivelSepsis.sin_sepsis)
    activado = Column(Boolean, default=False)

    # Acciones sugeridas (JSON-like en texto, se puede migrar a JSONB)
    recomendaciones = Column(Text, nullable=True)

    clasificacion_shock = Column(SAEnum(ClasificacionShock), nullable=True)

    tiempo_activacion = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    triaje = relationship("Triaje", back_populates="evaluacion_sepsis")
