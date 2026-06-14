import type { ClasificacionDolor } from "@/types";
import { CLASIFICACION_DOLOR_LABELS } from "@/lib/dolor";

const COLOR: Record<ClasificacionDolor, string> = {
  sin_dolor: "bg-gray-100 text-gray-700 border-gray-200",
  leve: "bg-green-100 text-green-700 border-green-200",
  moderado: "bg-yellow-100 text-yellow-700 border-yellow-200",
  severo: "bg-red-100 text-red-700 border-red-200",
};

export default function DolorBadge({ clasificacion }: { clasificacion?: ClasificacionDolor }) {
  if (!clasificacion) return <span className="text-gray-400 text-sm">Sin datos</span>;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR[clasificacion]}`}>
      {CLASIFICACION_DOLOR_LABELS[clasificacion]}
    </span>
  );
}
