"""
Motores de evaluacion de los codigos de activacion pediatricos adicionales al
Codigo Sepsis: Trauma, Convulsiones (estado convulsivo), Anafilaxia, PCR y
Dificultad Respiratoria Grave.

Referencias clinicas:
- Trauma: criterios fisiologicos/anatomicos/mecanismo de triage de trauma
  pediatrico (analogos a los usados en sistemas de trauma tipo ATLS).
- Convulsiones: definicion operacional de estado epileptico convulsivo
  (ILAE) — actividad continua >5 min o convulsiones repetidas sin
  recuperacion de conciencia entre ellas.
- Anafilaxia: criterios diagnosticos NIAID/WAO (2006).
- PCR: ausencia de respuesta + ausencia de respiracion efectiva + ausencia
  de circulacion efectiva (guias PALS de reanimacion pediatrica).
- Dificultad respiratoria grave: signos de trabajo respiratorio severo y
  signos de falla respiratoria inminente.

Cada evaluador es una funcion pura: recibe el objeto de criterios (schema
Pydantic *CriteriosIn, o el registro ORM ya guardado — ambos exponen los
mismos atributos booleanos) y retorna un dict con activado / nivel_gravedad /
criterios_positivos / recomendaciones.

Los diccionarios CRITERIOS_* (clave de campo -> etiqueta clinica) se exportan
para que el router pueda reconstruir "criterios positivos" al leer un
registro ya persistido, sin duplicar los textos.
"""
from typing import List


def _positivos(obj, mapa: dict) -> List[str]:
    return [label for key, label in mapa.items() if getattr(obj, key)]


# ---------------------------------------------------------------------------
# Codigo Trauma
# ---------------------------------------------------------------------------

CRITERIOS_TRAUMA = {
    "glasgow_menor_9": "Glasgow < 9 (TCE grave)",
    "inestabilidad_hemodinamica": "Inestabilidad hemodinámica",
    "dificultad_respiratoria_severa": "Dificultad respiratoria severa",
    "trauma_penetrante_mayor": "Trauma penetrante cabeza/cuello/tórax/abdomen",
    "amputacion_o_lesion_vascular": "Amputación / lesión vascular mayor",
    "fracturas_multiples_huesos_largos": "Fracturas múltiples de huesos largos",
    "quemadura_mayor_o_via_aerea": "Quemadura extensa (>20% SCT) o sospecha de vía aérea",
    "mecanismo_alto_riesgo": "Mecanismo de lesión de alto riesgo",
}
_TRAUMA_FISIOLOGICOS = ["glasgow_menor_9", "inestabilidad_hemodinamica", "dificultad_respiratoria_severa"]
_TRAUMA_ANATOMICOS = [
    "trauma_penetrante_mayor",
    "amputacion_o_lesion_vascular",
    "fracturas_multiples_huesos_largos",
    "quemadura_mayor_o_via_aerea",
]


def evaluar_trauma(c) -> dict:
    activado = any(getattr(c, k) for k in _TRAUMA_FISIOLOGICOS) or any(getattr(c, k) for k in _TRAUMA_ANATOMICOS)

    return {
        "activado": activado,
        "nivel_gravedad": "critico" if activado else None,
        "criterios_positivos": _positivos(c, CRITERIOS_TRAUMA),
        "recomendaciones": _recomendaciones_trauma(activado, c),
    }


def _recomendaciones_trauma(activado: bool, c) -> List[str]:
    if not activado:
        return ["Sin criterios de Código Trauma activos."]
    r = [
        "ACTIVAR CÓDIGO TRAUMA — Notificar equipo de trauma / cirugía pediátrica.",
        "Traslado inmediato a Shock Room / sala de reanimación.",
        "Secuencia ABCDE: vía aérea con control cervical, ventilación, circulación con control de hemorragias.",
        "2 accesos IV/IO de calibre grueso — reposición con cristaloides si hay inestabilidad.",
    ]
    if c.glasgow_menor_9:
        r.append("Manejo avanzado de vía aérea por TCE grave — considerar intubación.")
    if c.amputacion_o_lesion_vascular:
        r.append("Control de hemorragia con presión directa / torniquete si corresponde.")
    if c.quemadura_mayor_o_via_aerea:
        r.append("Evaluar vía aérea de forma precoz por posible lesión por inhalación.")
    r.append("Solicitar imágenes (FAST / TC) según estabilidad del paciente.")
    return r


# ---------------------------------------------------------------------------
# Codigo Convulsiones (estado convulsivo)
# ---------------------------------------------------------------------------

CRITERIOS_CONVULSIONES = {
    "convulsion_activa": "Convulsión activa al momento del triaje",
    "duracion_mayor_5_min": "Duración mayor a 5 minutos",
    "convulsiones_repetidas_sin_recuperacion": "Convulsiones repetidas sin recuperación de conciencia",
    "compromiso_via_aerea": "Compromiso de vía aérea",
    "glucemia_alterada_o_no_disponible": "Glucemia alterada o no disponible",
}


def evaluar_convulsiones(c) -> dict:
    # Estado epileptico convulsivo (ILAE): actividad continua >5 min, o
    # convulsiones repetidas sin recuperar el nivel de conciencia basal.
    activado = c.convulsion_activa and (c.duracion_mayor_5_min or c.convulsiones_repetidas_sin_recuperacion)

    return {
        "activado": activado,
        "nivel_gravedad": "critico" if activado else None,
        "criterios_positivos": _positivos(c, CRITERIOS_CONVULSIONES),
        "recomendaciones": _recomendaciones_convulsiones(activado, c),
    }


def _recomendaciones_convulsiones(activado: bool, c) -> List[str]:
    if not activado:
        return ["Sin criterios de estado convulsivo activo."]
    r = [
        "ACTIVAR CÓDIGO CONVULSIONES — Notificar médico de inmediato.",
        "Posición lateral de seguridad, proteger vía aérea, no forzar apertura bucal.",
        "Oxígeno suplementario y monitoreo continuo (FC, SatO2).",
        "Medir glucemia capilar de inmediato; corregir si hipoglucemia (< 60 mg/dl).",
        "Benzodiacepina de primera línea (diazepam rectal / midazolam IN-IM-IV según disponibilidad) si > 5 min.",
        "Si persiste tras la 2.ª dosis de benzodiacepina: escalar a fenitoína/levetiracetam — avisar UCI.",
    ]
    if c.compromiso_via_aerea:
        r.append("Compromiso de vía aérea — preparar manejo avanzado / aspiración.")
    return r


# ---------------------------------------------------------------------------
# Codigo Anafilaxia
# ---------------------------------------------------------------------------

CRITERIOS_ANAFILAXIA = {
    "afectacion_piel_mucosas": "Afectación piel/mucosas (urticaria, angioedema)",
    "compromiso_respiratorio": "Compromiso respiratorio",
    "compromiso_cardiovascular": "Compromiso cardiovascular (hipotensión/síncope)",
    "sintomas_gastrointestinales": "Síntomas gastrointestinales persistentes",
    "exposicion_alergeno_conocido": "Exposición a alérgeno conocido/probable",
}


def evaluar_anafilaxia(c) -> dict:
    """Criterios diagnosticos NIAID/WAO 2006 (cumplir 1 de los 3 alcanza)."""
    n_sistemas_sin_alergeno = sum([
        c.afectacion_piel_mucosas,
        c.compromiso_respiratorio,
        c.compromiso_cardiovascular,
        c.sintomas_gastrointestinales,
    ])

    criterio_1 = c.afectacion_piel_mucosas and (c.compromiso_respiratorio or c.compromiso_cardiovascular)
    criterio_2 = c.exposicion_alergeno_conocido and n_sistemas_sin_alergeno >= 2
    criterio_3 = c.exposicion_alergeno_conocido and c.compromiso_cardiovascular

    activado = criterio_1 or criterio_2 or criterio_3
    shock = activado and c.compromiso_cardiovascular

    return {
        "activado": activado,
        "nivel_gravedad": "shock_anafilactico" if shock else ("grave" if activado else None),
        "criterios_positivos": _positivos(c, CRITERIOS_ANAFILAXIA),
        "recomendaciones": _recomendaciones_anafilaxia(activado, shock),
    }


def _recomendaciones_anafilaxia(activado: bool, shock: bool) -> List[str]:
    if not activado:
        return ["No cumple criterios diagnósticos de anafilaxia (NIAID/WAO)."]
    r = [
        "ACTIVAR CÓDIGO ANAFILAXIA — Notificar médico de inmediato.",
        "ADRENALINA IM en cara anterolateral del muslo, 0.01 mg/kg (máx. 0.5 mg) — primera línea, sin demora.",
        "Retirar/detener el alérgeno si es identificable (ej. suspender infusión).",
        "Posición decúbito supino con piernas elevadas (o sentado si predomina disnea) — evitar bipedestación súbita.",
        "Oxígeno suplementario y monitoreo continuo (FC, TA, SatO2).",
        "Acceso IV — considerar bolo de cristaloides si hay compromiso cardiovascular.",
        "Repetir adrenalina IM cada 5-15 min si no hay respuesta.",
        "Observación mínima 4-6 h por riesgo de reacción bifásica.",
    ]
    if shock:
        r.insert(1, "SHOCK ANAFILÁCTICO — preparar segunda línea (antihistamínico, corticoide, broncodilatador) sin retrasar la adrenalina.")
    return r


# ---------------------------------------------------------------------------
# Codigo PCR
# ---------------------------------------------------------------------------

CRITERIOS_PCR = {
    "sin_respuesta": "Sin respuesta a estímulos",
    "sin_respiracion_o_gasping": "Sin respiración / gasping",
    "sin_pulso_palpable": "Sin pulso central palpable",
    "bradicardia_severa_mala_perfusion": "Bradicardia < 60 lpm con mala perfusión",
}


def evaluar_pcr(c) -> dict:
    sin_respuesta_ni_respiracion = c.sin_respuesta and c.sin_respiracion_o_gasping
    sin_circulacion_efectiva = c.sin_pulso_palpable or c.bradicardia_severa_mala_perfusion

    activado = sin_respuesta_ni_respiracion and sin_circulacion_efectiva

    return {
        "activado": activado,
        "nivel_gravedad": "critico" if activado else None,
        "criterios_positivos": _positivos(c, CRITERIOS_PCR),
        "recomendaciones": _recomendaciones_pcr(activado),
    }


def _recomendaciones_pcr(activado: bool) -> List[str]:
    if not activado:
        return ["Sin criterios de paro cardiorrespiratorio."]
    return [
        "ACTIVAR CÓDIGO PCR — Llamar al equipo de reanimación / carro de paro AHORA.",
        "Iniciar RCP de alta calidad de inmediato (30:2 o 15:2 según reanimadores disponibles).",
        "Conectar monitor/desfibrilador — identificar ritmo (desfibrilable vs. no desfibrilable).",
        "Vía aérea avanzada y oxígeno al 100% en cuanto esté disponible, sin interrumpir compresiones.",
        "Acceso IV/IO inmediato — adrenalina 0.01 mg/kg cada 3-5 min.",
        "Buscar y tratar causas reversibles (Hs y Ts): hipoxia, hipovolemia, hipo/hiperkalemia, hipotermia, neumotórax a tensión, taponamiento cardíaco, tóxicos, tromboembolismo.",
        "Registrar hora de inicio de RCP y horario de cada dosis de adrenalina.",
    ]


# ---------------------------------------------------------------------------
# Codigo Dificultad Respiratoria Grave
# ---------------------------------------------------------------------------

CRITERIOS_DIFICULTAD_RESPIRATORIA = {
    "fr_anormal_severa": "Frecuencia respiratoria muy anormal para la edad",
    "spo2_menor_90_con_o2": "SatO2 < 90% pese a oxígeno suplementario",
    "tiraje_severo_o_musculos_accesorios": "Tiraje severo / uso de músculos accesorios",
    "aleteo_nasal_o_quejido": "Aleteo nasal o quejido",
    "alteracion_conciencia_por_hipoxia": "Alteración de conciencia por hipoxia",
    "silencio_auscultatorio_o_estridor_severo": "Silencio auscultatorio / estridor severo",
    "cianosis": "Cianosis",
}
_DIFRESP_TRABAJO_RESPIRATORIO = ["fr_anormal_severa", "tiraje_severo_o_musculos_accesorios", "aleteo_nasal_o_quejido"]
_DIFRESP_FALLA_INMINENTE = [
    "spo2_menor_90_con_o2",
    "alteracion_conciencia_por_hipoxia",
    "silencio_auscultatorio_o_estridor_severo",
    "cianosis",
]


def evaluar_dificultad_respiratoria(c) -> dict:
    n_trabajo_respiratorio = sum(getattr(c, k) for k in _DIFRESP_TRABAJO_RESPIRATORIO)
    hay_falla_inminente = any(getattr(c, k) for k in _DIFRESP_FALLA_INMINENTE)

    activado = n_trabajo_respiratorio >= 2 or hay_falla_inminente

    return {
        "activado": activado,
        "nivel_gravedad": "falla_inminente" if hay_falla_inminente else ("critico" if activado else None),
        "criterios_positivos": _positivos(c, CRITERIOS_DIFICULTAD_RESPIRATORIA),
        "recomendaciones": _recomendaciones_dificultad_respiratoria(activado, c),
    }


def _recomendaciones_dificultad_respiratoria(activado: bool, c) -> List[str]:
    if not activado:
        return ["Sin criterios de dificultad respiratoria grave."]
    r = [
        "ACTIVAR CÓDIGO DIFICULTAD RESPIRATORIA GRAVE — Notificar médico de inmediato.",
        "Oxígeno de alto flujo — mascarilla con reservorio.",
        "Posición de confort (semisentado); minimizar estímulos que agiten al paciente.",
        "Monitoreo continuo: FR, SatO2, FC y trabajo respiratorio.",
        "Preparar equipo de vía aérea avanzada ante deterioro.",
    ]
    if c.silencio_auscultatorio_o_estridor_severo or c.cianosis or c.alteracion_conciencia_por_hipoxia:
        r.insert(1, "Signos de falla respiratoria inminente — considerar soporte ventilatorio (VNI/intubación) sin demora.")
    return r
