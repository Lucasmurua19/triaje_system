"""
Motor de clasificacion de triaje pediatrico de 5 niveles.
Toma en cuenta signos vitales, TEP y factores modificadores.
"""
from app.models.triaje import NivelTriaje, NivelConciencia, SignosVitales, EvaluacionTEP, FactoresRiesgo
from app.models.sepsis import NivelSepsis
from app.services.sepsis_service import calcular_edad_meses, obtener_rangos
from datetime import date


TIEMPO_ESPERA = {
    NivelTriaje.emergencia:      0,
    NivelTriaje.muy_urgente:    10,
    NivelTriaje.urgente:        30,
    NivelTriaje.menor_urgencia: 60,
    NivelTriaje.no_urgente:    120,
}


def clasificar_triaje(
    fecha_nacimiento: date,
    sv: SignosVitales,
    tep: EvaluacionTEP,
    fr: FactoresRiesgo,
) -> tuple[NivelTriaje, int]:
    """Retorna (nivel_triaje, minutos_espera)"""
    nivel = _calcular_nivel_base(fecha_nacimiento, sv, tep)
    nivel = _aplicar_factores_modificadores(nivel, fr)
    return nivel, TIEMPO_ESPERA[nivel]


def escalar_por_shock_septico(nivel: NivelTriaje, minutos: int, nivel_sepsis: NivelSepsis) -> tuple[NivelTriaje, int]:
    """Shock septico es una emergencia inmediata: fuerza Nivel 1 sin importar el nivel base de triaje."""
    if nivel_sepsis == NivelSepsis.shock_septico and nivel != NivelTriaje.emergencia:
        return NivelTriaje.emergencia, TIEMPO_ESPERA[NivelTriaje.emergencia]
    return nivel, minutos


def _calcular_nivel_base(
    fecha_nacimiento: date,
    sv: SignosVitales,
    tep: EvaluacionTEP,
) -> NivelTriaje:
    edad_meses = calcular_edad_meses(fecha_nacimiento)
    fc_max, fr_max, ta_min = obtener_rangos(edad_meses)

    # NIVEL 1 — Emergencia: riesgo vital inmediato
    if _es_nivel_1(sv, tep, ta_min):
        return NivelTriaje.emergencia

    # NIVEL 2 — Muy urgente: situacion de alto riesgo
    if _es_nivel_2(sv, tep, fc_max, fr_max, ta_min):
        return NivelTriaje.muy_urgente

    # NIVEL 3 — Urgente: signos vitales alterados sin compromiso vital inmediato
    if _es_nivel_3(sv, tep, fc_max, fr_max):
        return NivelTriaje.urgente

    # NIVEL 4 — Menor urgencia
    if _es_nivel_4(sv):
        return NivelTriaje.menor_urgencia

    # NIVEL 5 — No urgente
    return NivelTriaje.no_urgente


def _es_nivel_1(sv: SignosVitales, tep: EvaluacionTEP, ta_min: int) -> bool:
    """Paro cardiorespiratorio, inconsciencia, apnea, shock severo"""
    if sv.nivel_conciencia == NivelConciencia.inconsciente:
        return True
    if sv.glasgow is not None and sv.glasgow <= 8:
        return True
    if sv.saturacion_o2 is not None and sv.saturacion_o2 < 85:
        return True
    if sv.frecuencia_respiratoria is not None and sv.frecuencia_respiratoria == 0:
        return True
    if (sv.tension_arterial_sistolica is not None
            and sv.tension_arterial_sistolica < ta_min - 20):
        return True
    # TEP: los 3 lados alterados = critico
    if not tep.apariencia_normal and not tep.respiracion_normal and not tep.circulacion_normal:
        return True
    return False


def _es_nivel_2(sv: SignosVitales, tep: EvaluacionTEP, fc_max: int, fr_max: int, ta_min: int) -> bool:
    if sv.nivel_conciencia in (NivelConciencia.dolor, NivelConciencia.voz,
                                NivelConciencia.confuso, NivelConciencia.irritable):
        return True
    if sv.glasgow is not None and 9 <= sv.glasgow <= 13:
        return True
    if sv.saturacion_o2 is not None and sv.saturacion_o2 < 92:
        return True
    if sv.temperatura is not None and sv.temperatura >= 40.0:
        return True
    if sv.temperatura is not None and sv.temperatura < 36.0:
        return True
    if (sv.frecuencia_cardiaca is not None
            and sv.frecuencia_cardiaca > fc_max * 1.3):
        return True
    if (sv.frecuencia_respiratoria is not None
            and sv.frecuencia_respiratoria > fr_max * 1.5):
        return True
    if (sv.tension_arterial_sistolica is not None
            and sv.tension_arterial_sistolica < ta_min):
        return True
    if sv.llene_capilar_segundos is not None and sv.llene_capilar_segundos > 3.0:
        return True
    # TEP: 2 lados alterados
    alterados = sum([
        not tep.apariencia_normal,
        not tep.respiracion_normal,
        not tep.circulacion_normal,
    ])
    if alterados >= 2:
        return True
    return False


def _es_nivel_3(sv: SignosVitales, tep: EvaluacionTEP, fc_max: int, fr_max: int) -> bool:
    if sv.temperatura is not None and sv.temperatura >= 38.5:
        return True
    if sv.saturacion_o2 is not None and sv.saturacion_o2 < 95:
        return True
    if sv.frecuencia_cardiaca is not None and sv.frecuencia_cardiaca > fc_max:
        return True
    if sv.frecuencia_respiratoria is not None and sv.frecuencia_respiratoria > fr_max:
        return True
    if sv.llene_capilar_segundos is not None and sv.llene_capilar_segundos > 2.0:
        return True
    # TEP: 1 lado alterado
    if not tep.apariencia_normal or not tep.respiracion_normal or not tep.circulacion_normal:
        return True
    return False


def _es_nivel_4(sv: SignosVitales) -> bool:
    if sv.temperatura is not None and sv.temperatura >= 38.0:
        return True
    return False


def _aplicar_factores_modificadores(nivel: NivelTriaje, fr: FactoresRiesgo) -> NivelTriaje:
    """Sube el nivel de triaje (hacia emergencia) si hay factores de riesgo."""

    # Convulsión activa: fuerza mínimo nivel 2 sin importar los demás factores
    if fr.convulsion_activa and nivel.value > NivelTriaje.muy_urgente.value:
        return NivelTriaje.muy_urgente

    subir = False
    if fr.edad_menor_3_meses:
        subir = True
    if fr.inmunosupresion:
        subir = True
    if fr.oncologico:
        subir = True
    if fr.cardiopatia_congenita:
        subir = True
    if fr.dolor_severo:
        subir = True
    if fr.reconsulta_72h and nivel.value >= NivelTriaje.urgente.value:
        subir = True
    if fr.traslado_otro_centro and nivel.value >= NivelTriaje.urgente.value:
        subir = True

    if subir and nivel.value > NivelTriaje.emergencia.value:
        return NivelTriaje(nivel.value - 1)

    return nivel
