from pydantic import BaseModel, Field, computed_field
from datetime import datetime
from typing import List, Optional
from app.models.triaje import NivelTriaje, NivelConciencia, EscalaDolor, EstadoHidratacion, TipoAccion
from app.schemas.sepsis import SepsisBasico
from app.services.triaje_service import clasificar_dolor, recomendar_hidratacion


class SignosVitalesCreate(BaseModel):
    frecuencia_cardiaca: Optional[int] = None
    frecuencia_respiratoria: Optional[int] = None
    temperatura: Optional[float] = None
    saturacion_o2: Optional[int] = None
    tension_arterial_sistolica: Optional[int] = None
    tension_arterial_diastolica: Optional[int] = None
    nivel_conciencia: Optional[NivelConciencia] = None
    glasgow: Optional[int] = Field(None, ge=3, le=15)
    peso_kg: Optional[float] = None
    llene_capilar_segundos: Optional[float] = None
    escala_dolor: Optional[EscalaDolor] = None
    puntaje_dolor: Optional[int] = Field(None, ge=0, le=10)
    estado_hidratacion: Optional[EstadoHidratacion] = None


class SignosVitalesOut(SignosVitalesCreate):
    id: int
    triaje_id: int

    @computed_field
    @property
    def clasificacion_dolor(self) -> Optional[str]:
        return clasificar_dolor(self.escala_dolor, self.puntaje_dolor)

    @computed_field
    @property
    def recomendacion_hidratacion(self) -> Optional[str]:
        return recomendar_hidratacion(self.estado_hidratacion)

    class Config:
        from_attributes = True


class EvaluacionTEPCreate(BaseModel):
    apariencia_normal: bool = True
    apariencia_detalle: Optional[str] = None
    respiracion_normal: bool = True
    respiracion_detalle: Optional[str] = None
    circulacion_normal: bool = True
    circulacion_detalle: Optional[str] = None


class EvaluacionTEPOut(EvaluacionTEPCreate):
    id: int
    triaje_id: int

    class Config:
        from_attributes = True


class FactoresRiesgoCreate(BaseModel):
    edad_menor_3_meses: bool = False
    inmunosupresion: bool = False
    enfermedad_cronica: bool = False
    reconsulta_72h: bool = False
    dolor_severo: bool = False
    sospecha_infeccion: bool = False
    cardiopatia_congenita: bool = False
    oncologico: bool = False
    convulsion_activa: bool = False
    traslado_otro_centro: bool = False


class FactoresRiesgoOut(FactoresRiesgoCreate):
    id: int
    triaje_id: int

    class Config:
        from_attributes = True


class AccionTriajeCreate(BaseModel):
    tipo_accion: TipoAccion
    detalle: Optional[str] = None
    dosis: Optional[str] = None
    hora_administracion: Optional[datetime] = None


class AccionTriajeOut(AccionTriajeCreate):
    id: int
    triaje_id: int
    usuario_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TriajeCreate(BaseModel):
    paciente_id: int
    motivo_consulta: str


class TriajeCompleto(BaseModel):
    """Payload unico para crear triaje completo en un paso"""
    paciente_id: int
    motivo_consulta: str
    signos_vitales: SignosVitalesCreate
    evaluacion_tep: EvaluacionTEPCreate
    factores_riesgo: FactoresRiesgoCreate


class TriajeOut(BaseModel):
    id: int
    paciente_id: int
    usuario_id: int
    motivo_consulta: str
    nivel: Optional[NivelTriaje]
    tiempo_espera_minutos: Optional[int]
    fecha: datetime
    completado: bool
    signos_vitales: Optional[SignosVitalesOut]
    evaluacion_tep: Optional[EvaluacionTEPOut]
    factores_riesgo: Optional[FactoresRiesgoOut]
    evaluacion_sepsis: Optional[SepsisBasico] = None
    acciones: List[AccionTriajeOut] = []

    class Config:
        from_attributes = True
