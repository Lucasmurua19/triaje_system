from app.schemas.codigos_activacion import (
    TraumaCriteriosIn,
    ConvulsionesCriteriosIn,
    AnafilaxiaCriteriosIn,
    PCRCriteriosIn,
    DificultadRespiratoriaCriteriosIn,
)
from app.services.codigos_activacion_service import (
    evaluar_trauma,
    evaluar_convulsiones,
    evaluar_anafilaxia,
    evaluar_pcr,
    evaluar_dificultad_respiratoria,
)


# ---------------------------------------------------------------------------
# Codigo Trauma
# ---------------------------------------------------------------------------

class TestCodigoTrauma:
    def test_sin_criterios_no_activa(self):
        r = evaluar_trauma(TraumaCriteriosIn())
        assert r["activado"] is False
        assert r["criterios_positivos"] == []
        assert r["recomendaciones"] == ["Sin criterios de Código Trauma activos."]

    def test_un_criterio_fisiologico_activa(self):
        r = evaluar_trauma(TraumaCriteriosIn(glasgow_menor_9=True))
        assert r["activado"] is True
        assert r["nivel_gravedad"] == "critico"
        assert "Glasgow < 9 (TCE grave)" in r["criterios_positivos"]

    def test_un_criterio_anatomico_activa(self):
        r = evaluar_trauma(TraumaCriteriosIn(amputacion_o_lesion_vascular=True))
        assert r["activado"] is True

    def test_solo_mecanismo_de_riesgo_no_activa_por_si_solo(self):
        """El mecanismo de alto riesgo es un factor de alerta, pero sin hallazgo
        fisiologico o anatomico no basta para activar el codigo."""
        r = evaluar_trauma(TraumaCriteriosIn(mecanismo_alto_riesgo=True))
        assert r["activado"] is False
        assert "Mecanismo de lesión de alto riesgo" in r["criterios_positivos"]

    def test_recomendaciones_incluyen_manejo_via_aerea_si_glasgow_bajo(self):
        r = evaluar_trauma(TraumaCriteriosIn(glasgow_menor_9=True))
        assert any("intubación" in rec for rec in r["recomendaciones"])


# ---------------------------------------------------------------------------
# Codigo Convulsiones
# ---------------------------------------------------------------------------

class TestCodigoConvulsiones:
    def test_sin_convulsion_activa_no_activa_codigo(self):
        r = evaluar_convulsiones(ConvulsionesCriteriosIn(duracion_mayor_5_min=True))
        assert r["activado"] is False

    def test_convulsion_breve_no_activa_estado_convulsivo(self):
        r = evaluar_convulsiones(ConvulsionesCriteriosIn(convulsion_activa=True))
        assert r["activado"] is False

    def test_convulsion_mayor_5_min_activa(self):
        r = evaluar_convulsiones(
            ConvulsionesCriteriosIn(convulsion_activa=True, duracion_mayor_5_min=True)
        )
        assert r["activado"] is True

    def test_convulsiones_repetidas_sin_recuperacion_activa(self):
        r = evaluar_convulsiones(
            ConvulsionesCriteriosIn(
                convulsion_activa=True, convulsiones_repetidas_sin_recuperacion=True
            )
        )
        assert r["activado"] is True

    def test_recomendaciones_incluyen_compromiso_via_aerea(self):
        r = evaluar_convulsiones(
            ConvulsionesCriteriosIn(
                convulsion_activa=True, duracion_mayor_5_min=True, compromiso_via_aerea=True
            )
        )
        assert any("Compromiso de vía aérea" in rec for rec in r["recomendaciones"])


# ---------------------------------------------------------------------------
# Codigo Anafilaxia (criterios NIAID/WAO)
# ---------------------------------------------------------------------------

class TestCodigoAnafilaxia:
    def test_sin_criterios_no_activa(self):
        r = evaluar_anafilaxia(AnafilaxiaCriteriosIn())
        assert r["activado"] is False

    def test_criterio_1_piel_mas_respiratorio(self):
        r = evaluar_anafilaxia(
            AnafilaxiaCriteriosIn(afectacion_piel_mucosas=True, compromiso_respiratorio=True)
        )
        assert r["activado"] is True
        assert r["nivel_gravedad"] == "grave"

    def test_solo_piel_no_activa(self):
        r = evaluar_anafilaxia(AnafilaxiaCriteriosIn(afectacion_piel_mucosas=True))
        assert r["activado"] is False

    def test_criterio_2_exposicion_mas_dos_sistemas(self):
        r = evaluar_anafilaxia(
            AnafilaxiaCriteriosIn(
                exposicion_alergeno_conocido=True,
                afectacion_piel_mucosas=True,
                sintomas_gastrointestinales=True,
            )
        )
        assert r["activado"] is True

    def test_criterio_3_hipotension_tras_alergeno_conocido_es_shock(self):
        r = evaluar_anafilaxia(
            AnafilaxiaCriteriosIn(
                exposicion_alergeno_conocido=True, compromiso_cardiovascular=True
            )
        )
        assert r["activado"] is True
        assert r["nivel_gravedad"] == "shock_anafilactico"

    def test_compromiso_cardiovascular_siempre_clasifica_como_shock(self):
        r = evaluar_anafilaxia(
            AnafilaxiaCriteriosIn(
                afectacion_piel_mucosas=True, compromiso_cardiovascular=True
            )
        )
        assert r["nivel_gravedad"] == "shock_anafilactico"
        assert any("SHOCK ANAFILÁCTICO" in rec for rec in r["recomendaciones"])


# ---------------------------------------------------------------------------
# Codigo PCR
# ---------------------------------------------------------------------------

class TestCodigoPCR:
    def test_sin_criterios_no_activa(self):
        r = evaluar_pcr(PCRCriteriosIn())
        assert r["activado"] is False

    def test_sin_respuesta_y_apnea_sin_circulacion_activa(self):
        r = evaluar_pcr(
            PCRCriteriosIn(
                sin_respuesta=True, sin_respiracion_o_gasping=True, sin_pulso_palpable=True
            )
        )
        assert r["activado"] is True

    def test_bradicardia_severa_con_mala_perfusion_equivale_a_sin_pulso(self):
        r = evaluar_pcr(
            PCRCriteriosIn(
                sin_respuesta=True,
                sin_respiracion_o_gasping=True,
                bradicardia_severa_mala_perfusion=True,
            )
        )
        assert r["activado"] is True

    def test_solo_sin_pulso_sin_criterio_respiratorio_no_activa(self):
        r = evaluar_pcr(PCRCriteriosIn(sin_pulso_palpable=True))
        assert r["activado"] is False

    def test_recomendaciones_incluyen_rcp_inmediata(self):
        r = evaluar_pcr(
            PCRCriteriosIn(
                sin_respuesta=True, sin_respiracion_o_gasping=True, sin_pulso_palpable=True
            )
        )
        assert any("RCP" in rec for rec in r["recomendaciones"])


# ---------------------------------------------------------------------------
# Codigo Dificultad Respiratoria Grave
# ---------------------------------------------------------------------------

class TestCodigoDificultadRespiratoria:
    def test_sin_criterios_no_activa(self):
        r = evaluar_dificultad_respiratoria(DificultadRespiratoriaCriteriosIn())
        assert r["activado"] is False

    def test_un_solo_signo_de_trabajo_respiratorio_no_activa(self):
        r = evaluar_dificultad_respiratoria(DificultadRespiratoriaCriteriosIn(fr_anormal_severa=True))
        assert r["activado"] is False

    def test_dos_signos_de_trabajo_respiratorio_activan(self):
        r = evaluar_dificultad_respiratoria(
            DificultadRespiratoriaCriteriosIn(
                fr_anormal_severa=True, tiraje_severo_o_musculos_accesorios=True
            )
        )
        assert r["activado"] is True
        assert r["nivel_gravedad"] == "critico"

    def test_un_solo_signo_de_falla_inminente_activa(self):
        r = evaluar_dificultad_respiratoria(
            DificultadRespiratoriaCriteriosIn(spo2_menor_90_con_o2=True)
        )
        assert r["activado"] is True
        assert r["nivel_gravedad"] == "falla_inminente"

    def test_cianosis_sola_activa_como_falla_inminente(self):
        r = evaluar_dificultad_respiratoria(DificultadRespiratoriaCriteriosIn(cianosis=True))
        assert r["activado"] is True
        assert r["nivel_gravedad"] == "falla_inminente"

    def test_recomendaciones_incluyen_soporte_ventilatorio_si_falla_inminente(self):
        r = evaluar_dificultad_respiratoria(
            DificultadRespiratoriaCriteriosIn(silencio_auscultatorio_o_estridor_severo=True)
        )
        assert any("soporte ventilatorio" in rec for rec in r["recomendaciones"])
