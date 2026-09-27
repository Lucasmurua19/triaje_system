"""
Modelos de los codigos de activacion pediatricos adicionales al Codigo Sepsis:
Trauma, Convulsiones (estado convulsivo), Anafilaxia, PCR y Dificultad
Respiratoria Grave. Cada uno replica el patron de EvaluacionSepsis: criterios
clinicos explicitos + resultado de activacion + recomendaciones.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class EvaluacionTrauma(Base):
    __tablename__ = "evaluaciones_codigo_trauma"

    id = Column(Integer, primary_key=True, index=True)
    triaje_id = Column(Integer, ForeignKey("triajes.id"), nullable=False)

    # Criterios fisiologicos
    glasgow_menor_9 = Column(Boolean, default=False)
    inestabilidad_hemodinamica = Column(Boolean, default=False)
    dificultad_respiratoria_severa = Column(Boolean, default=False)

    # Criterios anatomicos
    trauma_penetrante_mayor = Column(Boolean, default=False)          # cabeza/cuello/torax/abdomen/ingle
    amputacion_o_lesion_vascular = Column(Boolean, default=False)
    fracturas_multiples_huesos_largos = Column(Boolean, default=False)
    quemadura_mayor_o_via_aerea = Column(Boolean, default=False)      # >20% SCT o sospecha de inhalacion

    # Mecanismo de lesion
    mecanismo_alto_riesgo = Column(Boolean, default=False)            # caida >3m, colision alta energia, eyeccion, atropello

    activado = Column(Boolean, default=False)
    recomendaciones = Column(Text, nullable=True)
    tiempo_activacion = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    triaje = relationship("Triaje", back_populates="evaluaciones_trauma")


class EvaluacionConvulsiones(Base):
    __tablename__ = "evaluaciones_codigo_convulsiones"

    id = Column(Integer, primary_key=True, index=True)
    triaje_id = Column(Integer, ForeignKey("triajes.id"), nullable=False)

    convulsion_activa = Column(Boolean, default=False)
    duracion_mayor_5_min = Column(Boolean, default=False)
    convulsiones_repetidas_sin_recuperacion = Column(Boolean, default=False)
    compromiso_via_aerea = Column(Boolean, default=False)
    glucemia_alterada_o_no_disponible = Column(Boolean, default=False)

    activado = Column(Boolean, default=False)
    recomendaciones = Column(Text, nullable=True)
    tiempo_activacion = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    triaje = relationship("Triaje", back_populates="evaluaciones_convulsiones")


class EvaluacionAnafilaxia(Base):
    __tablename__ = "evaluaciones_codigo_anafilaxia"

    id = Column(Integer, primary_key=True, index=True)
    triaje_id = Column(Integer, ForeignKey("triajes.id"), nullable=False)

    afectacion_piel_mucosas = Column(Boolean, default=False)
    compromiso_respiratorio = Column(Boolean, default=False)
    compromiso_cardiovascular = Column(Boolean, default=False)
    sintomas_gastrointestinales = Column(Boolean, default=False)
    exposicion_alergeno_conocido = Column(Boolean, default=False)

    activado = Column(Boolean, default=False)
    nivel_gravedad = Column(String(30), nullable=True)   # "grave" / "shock_anafilactico"
    recomendaciones = Column(Text, nullable=True)
    tiempo_activacion = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    triaje = relationship("Triaje", back_populates="evaluaciones_anafilaxia")


class EvaluacionPCR(Base):
    __tablename__ = "evaluaciones_codigo_pcr"

    id = Column(Integer, primary_key=True, index=True)
    triaje_id = Column(Integer, ForeignKey("triajes.id"), nullable=False)

    sin_respuesta = Column(Boolean, default=False)
    sin_respiracion_o_gasping = Column(Boolean, default=False)
    sin_pulso_palpable = Column(Boolean, default=False)
    bradicardia_severa_mala_perfusion = Column(Boolean, default=False)   # FC <60 lpm con mala perfusion

    activado = Column(Boolean, default=False)
    recomendaciones = Column(Text, nullable=True)
    tiempo_activacion = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    triaje = relationship("Triaje", back_populates="evaluaciones_pcr")


class EvaluacionDificultadRespiratoria(Base):
    __tablename__ = "evaluaciones_codigo_dificultad_respiratoria"

    id = Column(Integer, primary_key=True, index=True)
    triaje_id = Column(Integer, ForeignKey("triajes.id"), nullable=False)

    fr_anormal_severa = Column(Boolean, default=False)                       # taquipnea extrema o bradipnea/apnea
    spo2_menor_90_con_o2 = Column(Boolean, default=False)
    tiraje_severo_o_musculos_accesorios = Column(Boolean, default=False)
    aleteo_nasal_o_quejido = Column(Boolean, default=False)
    alteracion_conciencia_por_hipoxia = Column(Boolean, default=False)
    silencio_auscultatorio_o_estridor_severo = Column(Boolean, default=False)
    cianosis = Column(Boolean, default=False)

    activado = Column(Boolean, default=False)
    nivel_gravedad = Column(String(30), nullable=True)   # "critico" / "falla_inminente"
    recomendaciones = Column(Text, nullable=True)
    tiempo_activacion = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    triaje = relationship("Triaje", back_populates="evaluaciones_dificultad_respiratoria")
