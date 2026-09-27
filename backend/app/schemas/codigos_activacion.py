from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class TraumaCriteriosIn(BaseModel):
    glasgow_menor_9: bool = False
    inestabilidad_hemodinamica: bool = False
    dificultad_respiratoria_severa: bool = False
    trauma_penetrante_mayor: bool = False
    amputacion_o_lesion_vascular: bool = False
    fracturas_multiples_huesos_largos: bool = False
    quemadura_mayor_o_via_aerea: bool = False
    mecanismo_alto_riesgo: bool = False


class ConvulsionesCriteriosIn(BaseModel):
    convulsion_activa: bool = False
    duracion_mayor_5_min: bool = False
    convulsiones_repetidas_sin_recuperacion: bool = False
    compromiso_via_aerea: bool = False
    glucemia_alterada_o_no_disponible: bool = False


class AnafilaxiaCriteriosIn(BaseModel):
    afectacion_piel_mucosas: bool = False
    compromiso_respiratorio: bool = False
    compromiso_cardiovascular: bool = False
    sintomas_gastrointestinales: bool = False
    exposicion_alergeno_conocido: bool = False


class PCRCriteriosIn(BaseModel):
    sin_respuesta: bool = False
    sin_respiracion_o_gasping: bool = False
    sin_pulso_palpable: bool = False
    bradicardia_severa_mala_perfusion: bool = False


class DificultadRespiratoriaCriteriosIn(BaseModel):
    fr_anormal_severa: bool = False
    spo2_menor_90_con_o2: bool = False
    tiraje_severo_o_musculos_accesorios: bool = False
    aleteo_nasal_o_quejido: bool = False
    alteracion_conciencia_por_hipoxia: bool = False
    silencio_auscultatorio_o_estridor_severo: bool = False
    cianosis: bool = False


class CodigoActivacionResumen(BaseModel):
    """Respuesta comun para cualquiera de los 5 codigos de activacion."""
    tipo_codigo: str
    nombre: str
    activado: bool
    nivel_gravedad: Optional[str] = None
    criterios_positivos: List[str]
    recomendaciones: List[str]
    tiempo_activacion: Optional[datetime] = None
    color_alerta: str  # "verde" | "naranja" | "rojo"
