"""
Motor de clasificacion de triaje pediatrico de 5 niveles.
Toma en cuenta signos vitales, TEP y factores modificadores.
"""
from app.models.triaje import (
    NivelTriaje, NivelConciencia, EscalaDolor, EstadoHidratacion,
    SignosVitales, EvaluacionTEP, FactoresRiesgo,
)
from app.models.sepsis import NivelSepsis
from app.services.sepsis_service import calcular_edad_meses, obtener_rangos
from datetime import date
from typing import List


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


def explicar_nivel(
    fecha_nacimiento: date,
    sv: SignosVitales,
    tep: EvaluacionTEP,
    fr: FactoresRiesgo,
) -> List[str]:
    """Devuelve, en lenguaje clínico, los hallazgos anormales que respaldan el nivel
    sugerido — para que el profesional que confirma el nivel sepa en qué se basó el
    algoritmo (soporte a la decisión, no reemplazo del criterio clínico).

    Lista TODOS los hallazgos fuera de rango, no solo el primero que hizo cortar la
    clasificación en clasificar_triaje() — es más útil para la confirmación mostrar el
    cuadro completo que solo el criterio que técnicamente decidió el nivel.
    """
    edad_meses = calcular_edad_meses(fecha_nacimiento)
    fc_max, fr_max, ta_min = obtener_rangos(edad_meses)

    razones: List[str] = []

    lados_alterados = sum([not tep.apariencia_normal, not tep.respiracion_normal, not tep.circulacion_normal])
    if lados_alterados == 3:
        razones.append("TEP: los 3 lados alterados (apariencia, respiración y circulación) — crítico")
    elif lados_alterados == 2:
        razones.append("TEP: 2 lados alterados")
    elif lados_alterados == 1:
        lado = "apariencia" if not tep.apariencia_normal else ("respiración" if not tep.respiracion_normal else "circulación")
        razones.append(f"TEP: 1 lado alterado ({lado})")

    if sv.nivel_conciencia == NivelConciencia.inconsciente:
        razones.append("Sin respuesta (inconsciente)")
    elif sv.nivel_conciencia in (NivelConciencia.dolor, NivelConciencia.voz,
                                  NivelConciencia.confuso, NivelConciencia.irritable):
        valor = sv.nivel_conciencia.value if hasattr(sv.nivel_conciencia, "value") else sv.nivel_conciencia
        razones.append(f"Conciencia alterada ({valor})")

    if sv.glasgow is not None:
        if sv.glasgow <= 8:
            razones.append(f"Glasgow {sv.glasgow} (≤ 8)")
        elif sv.glasgow <= 13:
            razones.append(f"Glasgow {sv.glasgow} (9-13)")

    if sv.saturacion_o2 is not None:
        if sv.saturacion_o2 < 85:
            razones.append(f"SatO2 {sv.saturacion_o2}% (< 85%)")
        elif sv.saturacion_o2 < 92:
            razones.append(f"SatO2 {sv.saturacion_o2}% (< 92%)")
        elif sv.saturacion_o2 < 95:
            razones.append(f"SatO2 {sv.saturacion_o2}% (< 95%)")

    if sv.frecuencia_respiratoria is not None:
        if sv.frecuencia_respiratoria == 0:
            razones.append("Apnea (FR = 0)")
        elif sv.frecuencia_respiratoria > fr_max * 1.5:
            razones.append(f"FR {sv.frecuencia_respiratoria} rpm (muy por encima del límite de {fr_max} para la edad)")
        elif sv.frecuencia_respiratoria > fr_max:
            razones.append(f"FR {sv.frecuencia_respiratoria} rpm (> {fr_max}, límite para la edad)")

    if sv.frecuencia_cardiaca is not None:
        if sv.frecuencia_cardiaca > fc_max * 1.3:
            razones.append(f"FC {sv.frecuencia_cardiaca} lpm (muy por encima del límite de {fc_max} para la edad)")
        elif sv.frecuencia_cardiaca > fc_max:
            razones.append(f"FC {sv.frecuencia_cardiaca} lpm (> {fc_max}, límite para la edad)")

    if sv.tension_arterial_sistolica is not None:
        if sv.tension_arterial_sistolica < ta_min - 20:
            razones.append(f"TA sistólica {sv.tension_arterial_sistolica} mmHg (shock — muy por debajo de {ta_min} para la edad)")
        elif sv.tension_arterial_sistolica < ta_min:
            razones.append(f"TA sistólica {sv.tension_arterial_sistolica} mmHg (< {ta_min}, mínima para la edad)")

    if sv.temperatura is not None:
        if sv.temperatura >= 40.0:
            razones.append(f"Temperatura {sv.temperatura}°C (≥ 40°C)")
        elif sv.temperatura < 36.0:
            razones.append(f"Hipotermia {sv.temperatura}°C (< 36°C)")
        elif sv.temperatura >= 38.5:
            razones.append(f"Fiebre {sv.temperatura}°C (≥ 38.5°C)")
        elif sv.temperatura >= 38.0:
            razones.append(f"Fiebre {sv.temperatura}°C (≥ 38°C)")

    if sv.llene_capilar_segundos is not None:
        if sv.llene_capilar_segundos > 3.0:
            razones.append(f"Llene capilar {sv.llene_capilar_segundos}s (> 3s)")
        elif sv.llene_capilar_segundos > 2.0:
            razones.append(f"Llene capilar {sv.llene_capilar_segundos}s (> 2s)")

    if fr.convulsion_activa:
        razones.append("Convulsión activa (fuerza nivel mínimo 2)")
    if fr.edad_menor_3_meses:
        razones.append("Edad < 3 meses")
    if fr.inmunosupresion:
        razones.append("Inmunosupresión")
    if fr.oncologico:
        razones.append("Paciente oncológico / quimioterapia")
    if fr.cardiopatia_congenita:
        razones.append("Cardiopatía congénita")
    if fr.dolor_severo:
        razones.append("Dolor severo")
    if fr.reconsulta_72h:
        razones.append("Reconsulta dentro de las 72 horas")
    if fr.traslado_otro_centro:
        razones.append("Traslado desde otro centro")

    return razones


def clasificar_dolor(escala: EscalaDolor | None, puntaje: int | None) -> str | None:
    """Clasifica la intensidad del dolor a partir del puntaje registrado.

    Cortes para escalas 0-10 (FLACC, Wong-Baker, numerica): leve 1-3, moderado 4-7, severo 8-10.
    NIPS tiene rango 0-7, por lo que se normaliza proporcionalmente a 0-10 antes de clasificar.
    """
    if puntaje is None:
        return None

    score = puntaje
    if escala == EscalaDolor.nips:
        score = round(puntaje * 10 / 7)

    if score == 0:
        return "sin_dolor"
    if score <= 3:
        return "leve"
    if score <= 7:
        return "moderado"
    return "severo"


def recomendar_hidratacion(estado: EstadoHidratacion | None) -> str | None:
    """Sugiere el plan de rehidratacion (AIEPI/OMS) segun el estado evaluado."""
    if estado is None:
        return None

    if estado == EstadoHidratacion.normohidratado:
        return "Plan A: hidratacion habitual, indicar signos de alarma para reconsulta"
    if estado == EstadoHidratacion.deshidratacion_leve:
        return "Plan A/B: iniciar SRO (sales de rehidratacion oral) y reevaluar en 4 horas"
    if estado == EstadoHidratacion.deshidratacion_moderada:
        return "Plan B: SRO supervisado en sala (50-100 ml/kg en 4 horas) y reevaluar tolerancia"
    return "Plan C: rehidratacion IV urgente, alerta medica inmediata"


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
