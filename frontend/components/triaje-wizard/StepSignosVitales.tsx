"use client";
import { useForm } from "react-hook-form";
import type { SignosVitales } from "@/types";

interface Props {
  onNext: (data: SignosVitales) => void;
  onBack: () => void;
}

type FormData = {
  frecuencia_cardiaca: string;
  frecuencia_respiratoria: string;
  temperatura: string;
  saturacion_o2: string;
  tension_arterial_sistolica: string;
  tension_arterial_diastolica: string;
  nivel_conciencia: string;
  glasgow: string;
  peso_kg: string;
  llene_capilar_segundos: string;
};

const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

export default function StepSignosVitales({ onNext, onBack }: Props) {
  const { register, handleSubmit } = useForm<FormData>();

  function onSubmit(data: FormData) {
    onNext({
      frecuencia_cardiaca: num(data.frecuencia_cardiaca),
      frecuencia_respiratoria: num(data.frecuencia_respiratoria),
      temperatura: num(data.temperatura),
      saturacion_o2: num(data.saturacion_o2),
      tension_arterial_sistolica: num(data.tension_arterial_sistolica),
      tension_arterial_diastolica: num(data.tension_arterial_diastolica),
      nivel_conciencia: data.nivel_conciencia as SignosVitales["nivel_conciencia"] || undefined,
      glasgow: num(data.glasgow),
      peso_kg: num(data.peso_kg),
      llene_capilar_segundos: num(data.llene_capilar_segundos),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm text-gray-500">
        Completar los campos disponibles. Los valores vacíos no se evalúan.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">FC (lpm)</label>
          <input type="number" className="input" placeholder="ej: 120" {...register("frecuencia_cardiaca")} />
        </div>
        <div>
          <label className="label">FR (rpm)</label>
          <input type="number" className="input" placeholder="ej: 28" {...register("frecuencia_respiratoria")} />
        </div>
        <div>
          <label className="label">Temperatura (°C)</label>
          <input
            type="number"
            step="0.1"
            className="input"
            placeholder="ej: 38.5"
            {...register("temperatura")}
          />
        </div>
        <div>
          <label className="label">SatO₂ (%)</label>
          <input type="number" className="input" placeholder="ej: 97" {...register("saturacion_o2")} />
        </div>
        <div>
          <label className="label">TA sistólica (mmHg)</label>
          <input type="number" className="input" placeholder="ej: 100" {...register("tension_arterial_sistolica")} />
        </div>
        <div>
          <label className="label">TA diastólica (mmHg)</label>
          <input type="number" className="input" placeholder="ej: 65" {...register("tension_arterial_diastolica")} />
        </div>
        <div>
          <label className="label">Peso (kg)</label>
          <input type="number" step="0.1" className="input" placeholder="ej: 12.5" {...register("peso_kg")} />
        </div>
        <div>
          <label className="label">Llene capilar (seg)</label>
          <input
            type="number"
            step="0.5"
            className="input"
            placeholder="ej: 2.5"
            {...register("llene_capilar_segundos")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nivel de conciencia</label>
          <select className="input" {...register("nivel_conciencia")}>
            <option value="">Seleccionar...</option>
            <option value="alerta">Alerta — orientado, interactúa</option>
            <option value="irritable">Irritable — llanto inconsolable (lactante)</option>
            <option value="confuso">Confuso — desorientado pero responde</option>
            <option value="voz">Responde a voz solamente</option>
            <option value="dolor">Responde solo a dolor</option>
            <option value="inconsciente">Inconsciente — sin respuesta</option>
          </select>
        </div>
        <div>
          <label className="label">Glasgow (3–15)</label>
          <input
            type="number"
            min={3}
            max={15}
            className="input"
            placeholder="ej: 15"
            {...register("glasgow")}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          ← Volver
        </button>
        <button type="submit" className="btn-primary flex-1">
          Continuar → Factores de Riesgo
        </button>
      </div>
    </form>
  );
}
