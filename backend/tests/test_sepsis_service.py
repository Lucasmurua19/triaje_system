from datetime import date

from app.models.sepsis import NivelSepsis
from app.services.sepsis_service import calcular_edad_meses, evaluar_sirs, obtener_rangos

from .factories import make_fr, make_sv

# Bracket 2-5 anios: FC_max=140, FR_max=34, TA_sis_min=74
EDAD_2_ANIOS = 24


# ---------------------------------------------------------------------------
# calcular_edad_meses (Fix #1: tiene en cuenta el dia del mes, no solo mes/anio)
# ---------------------------------------------------------------------------

class TestCalcularEdadMeses:
    def test_exactamente_12_meses(self, hoy_fijo):
        assert calcular_edad_meses(date(2025, 6, 15)) == 12

    def test_un_dia_antes_de_cumplir_12_meses_sigue_en_11(self, hoy_fijo):
        # cumple 12 meses maniana -> hoy todavia tiene 11 (no debe redondear hacia arriba)
        assert calcular_edad_meses(date(2025, 6, 16)) == 11

    def test_un_dia_despues_del_cumplemes_sigue_en_12(self, hoy_fijo):
        # cumplio 12 meses ayer -> sigue siendo 12, no 13
        assert calcular_edad_meses(date(2025, 6, 14)) == 12

    def test_recien_nacido_de_pocos_dias_es_0_meses(self, hoy_fijo):
        assert calcular_edad_meses(date(2026, 6, 10)) == 0

    def test_un_mes_exacto(self, hoy_fijo):
        assert calcular_edad_meses(date(2026, 5, 15)) == 1

    def test_un_dia_antes_de_cumplir_un_mes_sigue_en_0(self, hoy_fijo):
        assert calcular_edad_meses(date(2026, 5, 16)) == 0


# ---------------------------------------------------------------------------
# obtener_rangos: bordes entre brackets etarios
# ---------------------------------------------------------------------------

class TestObtenerRangos:
    def test_neonato_0_meses(self):
        assert obtener_rangos(0) == (180, 60, 60)

    def test_borde_neonato_a_lactante(self):
        assert obtener_rangos(1) == (180, 50, 70)

    def test_lactante_11_meses(self):
        assert obtener_rangos(11) == (180, 50, 70)

    def test_borde_lactante_a_1_2_anios(self):
        assert obtener_rangos(12) == (150, 40, 75)

    def test_borde_2_5_anios(self):
        assert obtener_rangos(24) == (140, 34, 74)

    def test_borde_5_12_anios(self):
        assert obtener_rangos(60) == (130, 30, 83)

    def test_borde_12_18_anios(self):
        assert obtener_rangos(144) == (110, 22, 90)

    def test_mayor_a_18_anios_usa_rango_adulto(self):
        assert obtener_rangos(216) == (100, 20, 90)
        assert obtener_rangos(300) == (100, 20, 90)


# ---------------------------------------------------------------------------
# evaluar_sirs: criterios individuales
# ---------------------------------------------------------------------------

class TestCriteriosIndividuales:
    def test_paciente_sano_sin_criterios(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(), make_fr())
        assert r["total_criterios_sirs"] == 0
        assert r["nivel"] == NivelSepsis.sin_sepsis
        assert r["activado"] is False
        assert r["criterios_positivos"] == []

    def test_fiebre_mayor_38_5(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(temperatura=39.0), make_fr())
        assert r["criterio_temperatura"] is True

    def test_temperatura_38_5_no_cuenta_como_fiebre(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(temperatura=38.5), make_fr())
        assert r["criterio_temperatura"] is False

    def test_hipotermia_menor_36(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(temperatura=35.5), make_fr())
        assert r["criterio_temperatura"] is True

    def test_temperatura_36_no_cuenta_como_hipotermia(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(temperatura=36.0), make_fr())
        assert r["criterio_temperatura"] is False

    def test_taquicardia_sobre_el_limite(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(frecuencia_cardiaca=141), make_fr())
        assert r["criterio_taquicardia"] is True

    def test_fc_en_el_limite_no_es_taquicardia(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(frecuencia_cardiaca=140), make_fr())
        assert r["criterio_taquicardia"] is False

    def test_taquipnea_sobre_el_limite(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(frecuencia_respiratoria=35), make_fr())
        assert r["criterio_taquipnea"] is True

    def test_fr_en_el_limite_no_es_taquipnea(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(frecuencia_respiratoria=34), make_fr())
        assert r["criterio_taquipnea"] is False

    def test_alteracion_de_conciencia_marca_criterio_mental(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(nivel_conciencia="irritable"), make_fr())
        assert r["criterio_mental"] is True

    def test_glasgow_bajo_marca_mental_aunque_conciencia_sea_alerta(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(glasgow=13), make_fr())
        assert r["criterio_mental"] is True

    def test_glasgow_14_no_marca_mental(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(glasgow=14), make_fr())
        assert r["criterio_mental"] is False

    def test_perfusion_alterada_llene_mayor_2s(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(llene_capilar_segundos=2.5), make_fr())
        assert r["criterio_perfusion"] is True

    def test_llene_2s_no_es_perfusion_alterada(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(llene_capilar_segundos=2.0), make_fr())
        assert r["criterio_perfusion"] is False

    def test_leucocitos_siempre_falso_sin_laboratorio(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(), make_fr())
        assert r["criterio_leucocitos"] is False


# ---------------------------------------------------------------------------
# Clasificacion de niveles de sepsis (incluye Fix #3: criterio ancla)
# ---------------------------------------------------------------------------

class TestClasificacionSepsis:
    def test_dos_criterios_sin_ancla_no_activa_sepsis(self):
        """Taquicardia + taquipnea sin fiebre/mental/perfusion no debe activar sepsis (Fix #3)."""
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(frecuencia_cardiaca=150, frecuencia_respiratoria=40),
            make_fr(sospecha_infeccion=True),
        )
        assert r["total_criterios_sirs"] == 2
        assert r["nivel"] == NivelSepsis.sin_sepsis
        assert r["activado"] is False

    def test_fiebre_como_ancla_activa_sospecha(self):
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(temperatura=39.0, frecuencia_cardiaca=150),
            make_fr(sospecha_infeccion=True),
        )
        assert r["nivel"] == NivelSepsis.sospecha
        assert r["activado"] is True

    def test_glasgow_bajo_como_ancla_mental_activa_sospecha(self):
        # Glasgow<14 con conciencia=alerta marca "mental" sin contar como disfuncion organica
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(glasgow=13, frecuencia_cardiaca=150),
            make_fr(sospecha_infeccion=True),
        )
        assert r["criterio_mental"] is True
        assert r["nivel"] == NivelSepsis.sospecha

    def test_perfusion_como_ancla_activa_sospecha(self):
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(llene_capilar_segundos=2.5, frecuencia_respiratoria=40),
            make_fr(sospecha_infeccion=True),
        )
        assert r["nivel"] == NivelSepsis.sospecha

    def test_un_solo_criterio_sirs_no_activa_aunque_haya_ancla(self):
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(temperatura=39.0),
            make_fr(sospecha_infeccion=True),
        )
        assert r["total_criterios_sirs"] == 1
        assert r["nivel"] == NivelSepsis.sin_sepsis

    def test_sin_sospecha_infeccion_no_activa_aunque_haya_2_sirs_y_ancla(self):
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(temperatura=39.0, frecuencia_cardiaca=150),
            make_fr(sospecha_infeccion=False),
        )
        assert r["nivel"] == NivelSepsis.sin_sepsis

    def test_alteracion_de_conciencia_es_ancla_y_disfuncion_organica_a_la_vez(self):
        """nivel_conciencia != alerta cuenta como criterio mental Y como disfuncion organica:
        con 2+ SIRS + sospecha de infeccion, clasifica directo como sepsis_grave."""
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(nivel_conciencia="irritable", frecuencia_cardiaca=150),
            make_fr(sospecha_infeccion=True),
        )
        assert r["criterio_mental"] is True
        assert r["nivel"] == NivelSepsis.sepsis_grave

    def test_sepsis_grave_por_hipoxia(self):
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(temperatura=39.5, frecuencia_respiratoria=40, saturacion_o2=90),
            make_fr(sospecha_infeccion=True),
        )
        assert r["nivel"] == NivelSepsis.sepsis_grave

    def test_sepsis_grave_por_llene_capilar_mayor_3s(self):
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(temperatura=39.5, frecuencia_cardiaca=150, llene_capilar_segundos=3.5),
            make_fr(sospecha_infeccion=True),
        )
        assert r["nivel"] == NivelSepsis.sepsis_grave

    def test_shock_septico_por_hipotension(self):
        """Hipotension (TA sistolica < minima para edad) = shock_septico, con prioridad
        sobre la clasificacion de sepsis_grave."""
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(temperatura=39.5, frecuencia_cardiaca=150, tension_arterial_sistolica=70),
            make_fr(sospecha_infeccion=True),
        )
        assert r["nivel"] == NivelSepsis.shock_septico
        assert r["activado"] is True


# ---------------------------------------------------------------------------
# Recomendaciones y alerta < 3 meses
# ---------------------------------------------------------------------------

class TestRecomendaciones:
    def test_sin_sepsis_recomendacion_unica(self):
        r = evaluar_sirs(EDAD_2_ANIOS, make_sv(), make_fr())
        assert r["recomendaciones"] == ["Sin criterios de sepsis activos."]

    def test_alerta_menor_3_meses_se_agrega(self):
        r = evaluar_sirs(
            0,
            make_sv(temperatura=39.0, frecuencia_cardiaca=200),
            make_fr(sospecha_infeccion=True),
        )
        assert any("< 3 meses" in rec for rec in r["recomendaciones"])

    def test_sin_alerta_si_mayor_3_meses(self):
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(temperatura=39.0, frecuencia_cardiaca=150),
            make_fr(sospecha_infeccion=True),
        )
        assert not any("< 3 meses" in rec for rec in r["recomendaciones"])

    def test_shock_septico_incluye_recomendaciones_de_emergencia(self):
        r = evaluar_sirs(
            EDAD_2_ANIOS,
            make_sv(temperatura=39.5, frecuencia_cardiaca=150, tension_arterial_sistolica=70),
            make_fr(sospecha_infeccion=True),
        )
        assert any("SHOCK SÉPTICO" in rec for rec in r["recomendaciones"])
