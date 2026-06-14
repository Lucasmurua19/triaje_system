"""
Motor de reglas SIRS pediatrico basado en criterios IPSCC (Goldstein 2005).
Sepsis = 2+ criterios SIRS (uno DEBE ser temperatura o leucocitos) + infeccion sospechada.
"""
from datetime import date, datetime, timezone
from typing import Optional, List, Tuple
from dataclasses import dataclass

from app.models.triaje import SignosVitales, FactoresRiesgo, NivelConciencia
from app.models.sepsis import NivelSepsis


@dataclass
class RangosNormalesPediatricos:
    fc_min: int
    fc_max: int
    fr_min: int
    fr_max: int


# Rangos IPSCC por grupo etario (limite superior para taquicardia/taquipnea)
# (edad_min_meses, edad_max_meses, FC_max, FR_max, FC_bradicardia_min)
RANGOS_POR_EDAD = [
    # (meses_min, meses_max, FC_taqu, FR_taqu, TA_sis_min)
    (0,    1,    180, 60, 60),   # Neonato < 1 mes
    (1,    12,   180, 50, 70),   # Lactante 1-12 meses
    (12,   24,   150, 40, 75),   # 1-2 anos
    (24,   60,   140, 34, 74),   # 2-5 anos
    (60,   144,  130, 30, 83),   # 5-12 anos
    (144,  216,  110, 22, 90),   # 12-18 anos
]

TIEMPO_ATENCION_POR_NIVEL = {1: 0, 2: 10, 3: 30, 4: 60, 5: 120}


def calcular_edad_meses(fecha_nacimiento: date) -> int:
    hoy = date.today()
    meses = (hoy.year - fecha_nacimiento.year) * 12 + (hoy.month - fecha_nacimiento.month)
    if hoy.day < fecha_nacimiento.day:
        meses -= 1
    return meses


def obtener_rangos(edad_meses: int) -> Tuple[int, int, int]:
    """Retorna (FC_max_taquicardia, FR_max_taquipnea, TA_sis_minima)"""
    for min_m, max_m, fc, fr, ta in RANGOS_POR_EDAD:
        if min_m <= edad_meses < max_m:
            return fc, fr, ta
    # Mayor de 18 años — adulto
    return 100, 20, 90


def evaluar_sirs(
    edad_meses: int,
    sv: SignosVitales,
    fr: FactoresRiesgo,
) -> dict:
    """
    Evalua criterios SIRS pediatricos y retorna resultado completo.
    Requiere al menos: temperatura O frecuencia cardiaca O frecuencia respiratoria.
    """
    fc_max, fr_max, ta_min = obtener_rangos(edad_meses)

    criterios: dict[str, bool] = {
        "temperatura": False,
        "taquicardia": False,
        "taquipnea": False,
        "leucocitos": False,
        "mental": False,
        "perfusion": False,
    }

    # 1. Temperatura: fiebre >38.5°C o hipotermia <36°C
    if sv.temperatura is not None:
        criterios["temperatura"] = sv.temperatura > 38.5 or sv.temperatura < 36.0

    # 2. Taquicardia: FC > limite para edad
    if sv.frecuencia_cardiaca is not None:
        criterios["taquicardia"] = sv.frecuencia_cardiaca > fc_max

    # 3. Taquipnea: FR > limite para edad
    if sv.frecuencia_respiratoria is not None:
        criterios["taquipnea"] = sv.frecuencia_respiratoria > fr_max

    # 4. Leucocitos: no disponible en triaje inicial — clinico puede marcarlo
    # Se deja en False por defecto (sin laboratorio)

    # 5. Alteracion del estado mental
    if sv.nivel_conciencia is not None:
        criterios["mental"] = sv.nivel_conciencia != NivelConciencia.alerta
    if sv.glasgow is not None and sv.glasgow < 14:
        criterios["mental"] = True

    # 6. Perfusion alterada: llene capilar >2s
    if sv.llene_capilar_segundos is not None:
        criterios["perfusion"] = sv.llene_capilar_segundos > 2.0

    total_sirs = sum(criterios.values())

    # Sepsis segun IPSCC: >= 2 criterios SIRS + infeccion sospechada
    # Al menos uno debe ser temperatura (aqui relajamos: temperatura O mental O perfusion como ancla)
    tiene_ancla = criterios["temperatura"] or criterios["mental"] or criterios["perfusion"]
    sospecha_infeccion = fr.sospecha_infeccion

    nivel = _clasificar_nivel_sepsis(
        total_sirs=total_sirs,
        tiene_ancla=tiene_ancla,
        sospecha_infeccion=sospecha_infeccion,
        sv=sv,
        ta_min=ta_min,
    )

    activado = nivel in (NivelSepsis.sospecha, NivelSepsis.sepsis_grave, NivelSepsis.shock_septico)

    criterios_positivos = [
        _nombre_criterio(k) for k, v in criterios.items() if v
    ]

    recomendaciones = _generar_recomendaciones(nivel, edad_meses)

    return {
        "criterio_temperatura": criterios["temperatura"],
        "criterio_taquicardia": criterios["taquicardia"],
        "criterio_taquipnea": criterios["taquipnea"],
        "criterio_leucocitos": criterios["leucocitos"],
        "criterio_mental": criterios["mental"],
        "criterio_perfusion": criterios["perfusion"],
        "total_criterios_sirs": total_sirs,
        "nivel": nivel,
        "activado": activado,
        "criterios_positivos": criterios_positivos,
        "recomendaciones": recomendaciones,
    }


def _clasificar_nivel_sepsis(
    total_sirs: int,
    tiene_ancla: bool,
    sospecha_infeccion: bool,
    sv: SignosVitales,
    ta_min: int,
) -> NivelSepsis:
    if total_sirs < 2 or not sospecha_infeccion or not tiene_ancla:
        return NivelSepsis.sin_sepsis

    # Shock septico: hipotension a pesar de fluidos O necesidad de vasopresores
    # En triaje usamos TA sistolica < minima para edad como proxy
    hipotension = (
        sv.tension_arterial_sistolica is not None
        and sv.tension_arterial_sistolica < ta_min
    )
    if hipotension:
        return NivelSepsis.shock_septico

    # Sepsis grave: sepsis + >= 1 criterio de disfuncion organica
    # En triaje: conciencia alterada, SatO2 < 92, llene >3s
    disfuncion_organica = False
    if sv.nivel_conciencia is not None and sv.nivel_conciencia != NivelConciencia.alerta:
        disfuncion_organica = True
    if sv.saturacion_o2 is not None and sv.saturacion_o2 < 92:
        disfuncion_organica = True
    if sv.llene_capilar_segundos is not None and sv.llene_capilar_segundos > 3.0:
        disfuncion_organica = True

    if total_sirs >= 2 and disfuncion_organica:
        return NivelSepsis.sepsis_grave

    return NivelSepsis.sospecha


def _nombre_criterio(key: str) -> str:
    nombres = {
        "temperatura": "Fiebre / hipotermia",
        "taquicardia": "Taquicardia",
        "taquipnea": "Taquipnea",
        "leucocitos": "Leucocitosis / leucopenia",
        "mental": "Alteración del estado mental",
        "perfusion": "Perfusión alterada (llene capilar >2s)",
    }
    return nombres.get(key, key)


def _generar_recomendaciones(nivel: NivelSepsis, edad_meses: int) -> List[str]:
    base = []

    if nivel == NivelSepsis.sin_sepsis:
        return ["Sin criterios de sepsis activos."]

    if nivel == NivelSepsis.sospecha:
        base = [
            "Avisar al médico de guardia de inmediato.",
            "Extraer hemocultivos x2 antes de antibióticos.",
            "Solicitar: hemograma, PCR, lactato, función renal y hepática.",
            "Iniciar antibióticoterapia empírica según protocolo institucional.",
        ]

    elif nivel == NivelSepsis.sepsis_grave:
        base = [
            "ACTIVAR CÓDIGO SEPSIS — Notificar médico senior / UCI.",
            "Acceso IV inmediato — bolo de cristaloide 20 ml/kg en 15 min.",
            "Extraer hemocultivos x2 antes de antibióticos.",
            "Antibióticoterapia empírica de amplio espectro en < 60 min.",
            "Monitoreo continuo: FC, FR, SatO2, TA cada 15 min.",
            "Solicitar: lactato, hemograma, PCR, función renal, coagulación.",
            "Preparar para posible traslado a UCI.",
        ]

    elif nivel == NivelSepsis.shock_septico:
        base = [
            "SHOCK SÉPTICO — EMERGENCIA INMEDIATA.",
            "Llamar UCI pediátrica / médico senior AHORA.",
            "2 accesos IV calibre 20G o mayor.",
            "Bolo rápido cristaloide 20 ml/kg, repetir si no responde (max 60 ml/kg).",
            "Antibióticoterapia empírica INMEDIATA (< 30 min).",
            "Extraer hemocultivos sin demorar antibióticos.",
            "Preparar vasopresores (norepinefrina).",
            "Monitoreo invasivo según disponibilidad.",
            "Solicitar lactato — objetivo < 2 mmol/L.",
        ]

    if edad_meses < 3:
        base.append("ALERTA: paciente < 3 meses — riesgo aumentado, umbral de activación bajo.")

    return base
