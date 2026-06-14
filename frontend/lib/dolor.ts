import type { ClasificacionDolor, EscalaDolor } from "@/types";

export const ESCALA_DOLOR_LABELS: Record<EscalaDolor, string> = {
  nips: "NIPS (neonatos)",
  flacc: "FLACC (no colaboradores)",
  wong_baker: "Wong-Baker (caras, <7 años)",
  numerica: "Numérica / EVA (≥7 años)",
};

export const CLASIFICACION_DOLOR_LABELS: Record<ClasificacionDolor, string> = {
  sin_dolor: "Sin dolor",
  leve: "Leve",
  moderado: "Moderado",
  severo: "Severo",
};

export const PUNTAJE_MAX_POR_ESCALA: Record<EscalaDolor, number> = {
  nips: 7,
  flacc: 10,
  wong_baker: 10,
  numerica: 10,
};

/** Escala sugerida segun la edad del paciente (la enfermera puede cambiarla). */
export function escalaDolorPorEdad(edadMeses: number): EscalaDolor {
  if (edadMeses < 1) return "nips";
  if (edadMeses < 36) return "flacc";
  if (edadMeses < 84) return "wong_baker";
  return "numerica";
}

/** Replica clasificar_dolor() del backend para feedback inmediato en el formulario. */
export function clasificarDolor(
  escala: EscalaDolor | undefined,
  puntaje: number | undefined
): ClasificacionDolor | undefined {
  if (puntaje === undefined) return undefined;

  let score = puntaje;
  if (escala === "nips") score = Math.round((puntaje * 10) / 7);

  if (score === 0) return "sin_dolor";
  if (score <= 3) return "leve";
  if (score <= 7) return "moderado";
  return "severo";
}
