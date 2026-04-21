import type { NivelTriaje } from "@/types";

const CONFIG: Record<NivelTriaje, { label: string; color: string }> = {
  1: { label: "1 · Emergencia",     color: "bg-red-100 text-red-700 border-red-200" },
  2: { label: "2 · Muy Urgente",    color: "bg-orange-100 text-orange-700 border-orange-200" },
  3: { label: "3 · Urgente",        color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  4: { label: "4 · Menor Urgencia", color: "bg-green-100 text-green-700 border-green-200" },
  5: { label: "5 · No Urgente",     color: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function NivelBadge({ nivel }: { nivel?: NivelTriaje }) {
  if (!nivel) return <span className="text-gray-400 text-sm">Sin clasificar</span>;
  const { label, color } = CONFIG[nivel];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {label}
    </span>
  );
}
