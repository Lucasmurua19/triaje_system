from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.sepsis import NivelSepsis


class SepsisOut(BaseModel):
    id: int
    triaje_id: int
    criterio_temperatura: bool
    criterio_taquicardia: bool
    criterio_taquipnea: bool
    criterio_leucocitos: bool
    criterio_mental: bool
    criterio_perfusion: bool
    total_criterios_sirs: int
    nivel: NivelSepsis
    activado: bool
    recomendaciones: Optional[str]
    tiempo_activacion: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class SepsisResumen(BaseModel):
    nivel: NivelSepsis
    activado: bool
    total_criterios_sirs: int
    criterios_positivos: List[str]
    recomendaciones: List[str]
    color_alerta: str  # "verde", "amarillo", "rojo"
