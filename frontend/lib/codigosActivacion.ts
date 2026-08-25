import type { TipoCodigoActivacion } from "@/types";

export interface CriterioConfig {
  key: string;
  label: string;
}

export interface CodigoConfig {
  tipo: TipoCodigoActivacion;
  nombre: string;
  icono: string;
  endpoint: string;
  criterios: CriterioConfig[];
}

export const CODIGOS_ACTIVACION: CodigoConfig[] = [
  {
    tipo: "pcr",
    nombre: "Código PCR",
    icono: "🆘",
    endpoint: "pcr",
    criterios: [
      { key: "sin_respuesta", label: "Sin respuesta a estímulos" },
      { key: "sin_respiracion_o_gasping", label: "Sin respiración / gasping" },
      { key: "sin_pulso_palpable", label: "Sin pulso central palpable" },
      { key: "bradicardia_severa_mala_perfusion", label: "Bradicardia < 60 lpm con mala perfusión" },
    ],
  },
  {
    tipo: "anafilaxia",
    nombre: "Código Anafilaxia",
    icono: "🐝",
    endpoint: "anafilaxia",
    criterios: [
      { key: "afectacion_piel_mucosas", label: "Afectación piel/mucosas (urticaria, angioedema)" },
      { key: "compromiso_respiratorio", label: "Compromiso respiratorio" },
      { key: "compromiso_cardiovascular", label: "Compromiso cardiovascular (hipotensión/síncope)" },
      { key: "sintomas_gastrointestinales", label: "Síntomas gastrointestinales persistentes" },
      { key: "exposicion_alergeno_conocido", label: "Exposición a alérgeno conocido/probable" },
    ],
  },
  {
    tipo: "dificultad_respiratoria",
    nombre: "Dificultad Respiratoria Grave",
    icono: "🫁",
    endpoint: "dificultad-respiratoria",
    criterios: [
      { key: "fr_anormal_severa", label: "Frecuencia respiratoria muy anormal para la edad" },
      { key: "spo2_menor_90_con_o2", label: "SatO2 < 90% pese a oxígeno suplementario" },
      { key: "tiraje_severo_o_musculos_accesorios", label: "Tiraje severo / uso de músculos accesorios" },
      { key: "aleteo_nasal_o_quejido", label: "Aleteo nasal o quejido" },
      { key: "alteracion_conciencia_por_hipoxia", label: "Alteración de conciencia por hipoxia" },
      { key: "silencio_auscultatorio_o_estridor_severo", label: "Silencio auscultatorio / estridor severo" },
      { key: "cianosis", label: "Cianosis" },
    ],
  },
  {
    tipo: "convulsiones",
    nombre: "Código Convulsiones",
    icono: "⚡",
    endpoint: "convulsiones",
    criterios: [
      { key: "convulsion_activa", label: "Convulsión activa al momento del triaje" },
      { key: "duracion_mayor_5_min", label: "Duración mayor a 5 minutos" },
      { key: "convulsiones_repetidas_sin_recuperacion", label: "Convulsiones repetidas sin recuperación de conciencia" },
      { key: "compromiso_via_aerea", label: "Compromiso de vía aérea" },
      { key: "glucemia_alterada_o_no_disponible", label: "Glucemia alterada o no disponible" },
    ],
  },
  {
    tipo: "trauma",
    nombre: "Código Trauma",
    icono: "🩸",
    endpoint: "trauma",
    criterios: [
      { key: "glasgow_menor_9", label: "Glasgow < 9 (TCE grave)" },
      { key: "inestabilidad_hemodinamica", label: "Inestabilidad hemodinámica" },
      { key: "dificultad_respiratoria_severa", label: "Dificultad respiratoria severa" },
      { key: "trauma_penetrante_mayor", label: "Trauma penetrante cabeza/cuello/tórax/abdomen" },
      { key: "amputacion_o_lesion_vascular", label: "Amputación / lesión vascular mayor" },
      { key: "fracturas_multiples_huesos_largos", label: "Fracturas múltiples de huesos largos" },
      { key: "quemadura_mayor_o_via_aerea", label: "Quemadura extensa (>20% SCT) o sospecha de vía aérea" },
      { key: "mecanismo_alto_riesgo", label: "Mecanismo de lesión de alto riesgo" },
    ],
  },
];
