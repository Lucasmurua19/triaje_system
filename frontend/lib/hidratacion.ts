import type { EstadoHidratacion } from "@/types";

export const ESTADO_HIDRATACION_LABELS: Record<EstadoHidratacion, string> = {
  normohidratado: "Normohidratado",
  deshidratacion_leve: "Deshidratación leve",
  deshidratacion_moderada: "Deshidratación moderada",
  deshidratacion_severa: "Deshidratación severa",
};

const RECOMENDACION_HIDRATACION: Record<EstadoHidratacion, string> = {
  normohidratado: "Plan A: hidratación habitual, indicar signos de alarma para reconsulta",
  deshidratacion_leve: "Plan A/B: iniciar SRO (sales de rehidratación oral) y reevaluar en 4 horas",
  deshidratacion_moderada: "Plan B: SRO supervisado en sala (50-100 ml/kg en 4 horas) y reevaluar tolerancia",
  deshidratacion_severa: "Plan C: rehidratación IV urgente, alerta médica inmediata",
};

export function recomendarHidratacion(estado?: EstadoHidratacion): string | undefined {
  if (!estado) return undefined;
  return RECOMENDACION_HIDRATACION[estado];
}
