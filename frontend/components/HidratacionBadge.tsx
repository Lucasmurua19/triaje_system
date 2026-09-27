import type { EstadoHidratacion } from "@/types";
import { ESTADO_HIDRATACION_LABELS } from "@/lib/hidratacion";

const COLOR: Record<EstadoHidratacion, string> = {
  normohidratado: "bg-green-100 text-green-700 border-green-200",
  deshidratacion_leve: "bg-yellow-100 text-yellow-700 border-yellow-200",
  deshidratacion_moderada: "bg-orange-100 text-orange-700 border-orange-200",
  deshidratacion_severa: "bg-red-100 text-red-700 border-red-200",
};

export default function HidratacionBadge({ estado }: { estado?: EstadoHidratacion }) {
  if (!estado) return <span className="text-gray-400 text-sm">Sin datos</span>;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR[estado]}`}>
      {ESTADO_HIDRATACION_LABELS[estado]}
    </span>
  );
}
