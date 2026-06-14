from app.models.triaje import EvaluacionTEP, FactoresRiesgo, SignosVitales


def make_sv(**kwargs) -> SignosVitales:
    """Signos vitales 'normales' de base (paciente sano), pisables por kwargs."""
    base = dict(
        frecuencia_cardiaca=90,
        frecuencia_respiratoria=18,
        temperatura=37.0,
        saturacion_o2=98,
        tension_arterial_sistolica=100,
        tension_arterial_diastolica=65,
        nivel_conciencia="alerta",
        glasgow=15,
        peso_kg=25,
        llene_capilar_segundos=1.5,
    )
    base.update(kwargs)
    return SignosVitales(**base)


def make_tep(**kwargs) -> EvaluacionTEP:
    base = dict(apariencia_normal=True, respiracion_normal=True, circulacion_normal=True)
    base.update(kwargs)
    return EvaluacionTEP(**base)


def make_fr(**kwargs) -> FactoresRiesgo:
    return FactoresRiesgo(**kwargs)
