"use client";
import { useForm } from "react-hook-form";
import type { FactoresRiesgo } from "@/types";

interface Props {
  onSubmit: (data: FactoresRiesgo) => void;
  onBack: () => void;
  loading: boolean;
}

const FACTORES = [
  { key: "sospecha_infeccion",   label: "Sospecha de infección",              icon: "🦠", color: "red"    },
  { key: "convulsion_activa",    label: "Convulsión activa o reciente",        icon: "⚡", color: "red"    },
  { key: "oncologico",           label: "Oncológico / quimioterapia activa",   icon: "🎗️", color: "red"    },
  { key: "edad_menor_3_meses",   label: "Edad menor de 3 meses",              icon: "👶", color: "orange" },
  { key: "inmunosupresion",      label: "Inmunosupresión",                    icon: "💊", color: "orange" },
  { key: "cardiopatia_congenita",label: "Cardiopatía congénita",              icon: "❤️", color: "orange" },
  { key: "traslado_otro_centro", label: "Traslado desde otro centro",         icon: "🚑", color: "orange" },
  { key: "enfermedad_cronica",   label: "Enfermedad crónica de base",         icon: "📋", color: "yellow" },
  { key: "reconsulta_72h",       label: "Reconsulta en últimas 72 hs",        icon: "🔄", color: "yellow" },
  { key: "dolor_severo",         label: "Dolor severo (EVA > 7)",             icon: "😣", color: "yellow" },
] as const;

type ColorClass = "red" | "orange" | "yellow";

const colorMap: Record<ColorClass, { bg: string; border: string; text: string }> = {
  red:    { bg: "bg-red-50",    border: "border-red-300",    text: "text-red-700" },
  orange: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700" },
};

export default function StepFactoresRiesgo({ onSubmit, onBack, loading }: Props) {
  const { register, handleSubmit, watch } = useForm<FactoresRiesgo>({
    defaultValues: {
      sospecha_infeccion: false,
      edad_menor_3_meses: false,
      inmunosupresion: false,
      enfermedad_cronica: false,
      reconsulta_72h: false,
      dolor_severo: false,
      cardiopatia_congenita: false,
      oncologico: false,
      convulsion_activa: false,
      traslado_otro_centro: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm text-gray-500">
        Marcar todos los factores presentes. El campo <strong>Sospecha de infección</strong> es clave
        para la activación del Código Sepsis.
      </p>

      <div className="space-y-3">
        {FACTORES.map(({ key, label, icon, color }) => {
          const checked = watch(key);
          const c = colorMap[color];
          return (
            <label
              key={key}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                checked ? `${c.bg} ${c.border}` : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <input type="checkbox" className="hidden" {...register(key)} />
              <div
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                  checked ? `${c.border} bg-current` : "border-gray-300"
                }`}
              >
                {checked && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <span className="text-xl">{icon}</span>
              <span className={`font-medium ${checked ? c.text : "text-gray-700"}`}>{label}</span>
            </label>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          ← Volver
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Procesando..." : "Finalizar Triaje →"}
        </button>
      </div>
    </form>
  );
}
