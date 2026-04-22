"use client";
import { useForm } from "react-hook-form";
import type { FactoresRiesgo, EstadoHidratacion } from "@/types";

export interface StepFactoresRiesgoData {
  factores_riesgo: FactoresRiesgo;
  es_fast_track: boolean;
  estado_hidratacion: EstadoHidratacion;
}

interface Props {
  onSubmit: (data: StepFactoresRiesgoData) => void;
  onBack: () => void;
  loading: boolean;
}

const FACTORES = [
  { key: "sospecha_infeccion", label: "Sospecha de infección", icon: "🦠", color: "red" },
  { key: "edad_menor_3_meses", label: "Edad menor de 3 meses", icon: "👶", color: "orange" },
  { key: "inmunosupresion", label: "Inmunosupresión", icon: "💊", color: "orange" },
  { key: "enfermedad_cronica", label: "Enfermedad crónica de base", icon: "📋", color: "yellow" },
  { key: "reconsulta_72h", label: "Reconsulta en últimas 72 hs", icon: "🔄", color: "yellow" },
  { key: "dolor_severo", label: "Dolor severo (score > 7)", icon: "😣", color: "yellow" },
] as const;

type ColorClass = "red" | "orange" | "yellow";
const colorMap: Record<ColorClass, { bg: string; border: string; text: string }> = {
  red:    { bg: "bg-red-50",    border: "border-red-300",    text: "text-red-700" },
  orange: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700" },
};

interface FormData extends FactoresRiesgo {
  es_fast_track: boolean;
  estado_hidratacion: EstadoHidratacion;
}

export default function StepFactoresRiesgo({ onSubmit, onBack, loading }: Props) {
  const { register, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      sospecha_infeccion: false,
      edad_menor_3_meses: false,
      inmunosupresion: false,
      enfermedad_cronica: false,
      reconsulta_72h: false,
      dolor_severo: false,
      es_fast_track: false,
      estado_hidratacion: "no_aplica",
    },
  });

  function handleFormSubmit(data: FormData) {
    const { es_fast_track, estado_hidratacion, ...factores } = data;
    onSubmit({
      factores_riesgo: factores,
      es_fast_track,
      estado_hidratacion,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <p className="text-sm text-gray-500">
        Marcar todos los factores presentes. <strong>Sospecha de infección</strong> activa la evaluación de Código Sepsis.
      </p>

      {/* Factores de riesgo */}
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

      {/* Hidratación */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Estado de hidratación</p>
        <p className="text-xs text-gray-400">Evaluar en casos con vómitos y/o diarrea</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "no_aplica",            label: "No aplica",              color: "gray" },
            { value: "normohidratado",        label: "Normohidratado",         color: "green" },
            { value: "deshidratacion_leve",   label: "Deshidratación leve",    color: "yellow" },
            { value: "deshidratacion_moderada", label: "Deshidratación moderada", color: "red" },
          ].map(({ value, label, color }) => {
            const selected = watch("estado_hidratacion") === value;
            const cls =
              color === "gray"   ? "border-gray-300 bg-gray-50 text-gray-600"
              : color === "green"  ? "border-green-400 bg-green-50 text-green-700"
              : color === "yellow" ? "border-yellow-400 bg-yellow-50 text-yellow-700"
              : "border-red-400 bg-red-50 text-red-700";
            return (
              <label
                key={value}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                  selected ? cls : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                <input type="radio" className="hidden" value={value} {...register("estado_hidratacion")} />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected ? "border-current" : "border-gray-300"}`}>
                  {selected && <div className="w-2 h-2 rounded-full bg-current" />}
                </div>
                <span className="text-sm font-medium">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Fast Track */}
      <div className="border border-gray-200 rounded-xl p-4">
        <label className={`flex items-center gap-4 cursor-pointer ${watch("es_fast_track") ? "text-teal-700" : "text-gray-700"}`}>
          <input type="checkbox" className="hidden" {...register("es_fast_track")} />
          <div
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
              watch("es_fast_track") ? "border-teal-500 bg-teal-500" : "border-gray-300"
            }`}
          >
            {watch("es_fast_track") && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <div>
            <p className="font-semibold">Candidato a Fast Track (Vía Rápida)</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Niveles IV–V · Baja complejidad · Sin condiciones crónicas de riesgo
            </p>
          </div>
        </label>
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
