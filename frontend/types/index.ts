export type Rol = "medico" | "enfermera" | "admin";
export type TipoAccion =
  | "analgesico"
  | "antipiretico"
  | "sro"
  | "oxigeno"
  | "inmovilizacion"
  | "limpieza_herida"
  | "otro";
export type Sexo = "masculino" | "femenino";
export type NivelConciencia = "alerta" | "voz" | "dolor" | "inconsciente";
export type NivelTriaje = 1 | 2 | 3 | 4 | 5;
export type NivelSepsis = "sin_sepsis" | "sospecha" | "sepsis_grave" | "shock_septico";

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  is_active: boolean;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  sexo: Sexo;
  documento?: string;
  telefono_contacto?: string;
  observaciones?: string;
  grupo_sanguineo?: string;
  alergias?: string;
  enfermedades_cronicas?: string;
  medicacion_habitual?: string;
  antecedentes_quirurgicos?: string;
  created_at: string;
}

export interface SignosVitales {
  frecuencia_cardiaca?: number;
  frecuencia_respiratoria?: number;
  temperatura?: number;
  saturacion_o2?: number;
  tension_arterial_sistolica?: number;
  tension_arterial_diastolica?: number;
  nivel_conciencia?: NivelConciencia;
  glasgow?: number;
  peso_kg?: number;
  llene_capilar_segundos?: number;
}

export interface EvaluacionTEP {
  apariencia_normal: boolean;
  apariencia_detalle?: string;
  respiracion_normal: boolean;
  respiracion_detalle?: string;
  circulacion_normal: boolean;
  circulacion_detalle?: string;
}

export interface FactoresRiesgo {
  edad_menor_3_meses: boolean;
  inmunosupresion: boolean;
  enfermedad_cronica: boolean;
  reconsulta_72h: boolean;
  dolor_severo: boolean;
  sospecha_infeccion: boolean;
}

export interface AccionTriaje {
  id: number;
  triaje_id: number;
  usuario_id: number;
  tipo_accion: TipoAccion;
  detalle?: string;
  dosis?: string;
  hora_administracion?: string;
  created_at: string;
}

export interface Triaje {
  id: number;
  paciente_id: number;
  usuario_id: number;
  motivo_consulta: string;
  nivel?: NivelTriaje;
  tiempo_espera_minutos?: number;
  fecha: string;
  completado: boolean;
  signos_vitales?: SignosVitales & { id: number; triaje_id: number };
  evaluacion_tep?: EvaluacionTEP & { id: number; triaje_id: number };
  factores_riesgo?: FactoresRiesgo & { id: number; triaje_id: number };
  acciones: AccionTriaje[];
}

export interface SepsisResumen {
  nivel: NivelSepsis;
  activado: boolean;
  total_criterios_sirs: number;
  criterios_positivos: string[];
  recomendaciones: string[];
  color_alerta: "verde" | "amarillo" | "rojo";
}

export interface TriajeCompletoPayload {
  paciente_id: number;
  motivo_consulta: string;
  signos_vitales: SignosVitales;
  evaluacion_tep: EvaluacionTEP;
  factores_riesgo: FactoresRiesgo;
}
