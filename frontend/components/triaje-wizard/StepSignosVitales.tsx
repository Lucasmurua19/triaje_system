"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { SignosVitales, EscalaDolor, Paciente } from "@/types";

interface Props {
  paciente: Paciente;
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

function calcularMeses(fechaNac: string): number {
  const hoy = new Date();
  const nac = new Date(fechaNac);
  return (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
}

function determinarEscala(meses: number): EscalaDolor {
  if (meses < 1) return "nips";
  if (meses < 36) return "flacc";
  if (meses < 84) return "wong_baker";
  return "numerica";
}

const ESCALA_INFO: Record<EscalaDolor, { nombre: string; rango: string; descripcion: string }> = {
  nips:       { nombre: "NIPS",        rango: "0–7",  descripcion: "Neonatal Infant Pain Scale — para recién nacidos (<1 mes)" },
  flacc:      { nombre: "FLACC",       rango: "0–10", descripcion: "Face, Legs, Activity, Cry, Consolability — 1 mes a 3 años" },
  wong_baker: { nombre: "Wong-Baker",  rango: "0–10", descripcion: "Escala de caras — 3 a 7 años" },
  numerica:   { nombre: "Numérica",    rango: "0–10", descripcion: "Escala numérica verbal — mayores de 7 años" },
};

const WONG_BAKER_OPCIONES = [
  { valor: 0,  descripcion: "No duele" },
  { valor: 2,  descripcion: "Duele un poco" },
  { valor: 4,  descripcion: "Duele un poco más" },
  { valor: 6,  descripcion: "Duele bastante" },
  { valor: 8,  descripcion: "Duele mucho" },
  { valor: 10, descripcion: "El peor dolor" },
];

export default function StepSignosVitales({ paciente, onNext, onBack }: Props) {
  const { register, handleSubmit } = useForm<FormData>();
  const meses = calcularMeses(paciente.fecha_nacimiento);
  const escala = determinarEscala(meses);
  const info = ESCALA_INFO[escala];
  const maxScore = escala === "nips" ? 7 : 10;

  const [scoreDolor, setScoreDolor] = useState<number | undefined>(undefined);

  function onSubmit(data: FormData) {
    onNext({
      frecuencia_cardiaca:      num(data.frecuencia_cardiaca),
      frecuencia_respiratoria:  num(data.frecuencia_respiratoria),
      temperatura:              num(data.temperatura),
      saturacion_o2:            num(data.saturacion_o2),
      tension_arterial_sistolica:  num(data.tension_arterial_sistolica),
      tension_arterial_diastolica: num(data.tension_arterial_diastolica),
      nivel_conciencia: data.nivel_conciencia as SignosVitales["nivel_conciencia"] || undefined,
      glasgow:          num(data.glasgow),
      peso_kg:          num(data.peso_kg),
      llene_capilar_segundos: num(data.llene_capilar_segundos),
      escala_dolor: scoreDolor !== undefined ? escala : undefined,
      score_dolor:  scoreDolor,
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
          <input type="number" step="0.1" className="input" placeholder="ej: 38.5" {...register("temperatura")} />
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
          <input type="number" step="0.5" className="input" placeholder="ej: 2.5" {...register("llene_capilar_segundos")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nivel de conciencia</label>
          <select className="input" {...register("nivel_conciencia")}>
            <option value="">Seleccionar...</option>
            <option value="alerta">Alerta</option>
            <option value="voz">Responde a voz</option>
            <option value="dolor">Responde a dolor</option>
            <option value="inconsciente">Inconsciente</option>
          </select>
        </div>
        <div>
          <label className="label">Glasgow (3–15)</label>
          <input type="number" min={3} max={15} className="input" placeholder="ej: 15" {...register("glasgow")} />
        </div>
      </div>

      {/* Escala de dolor */}
      <div className="border border-blue-100 rounded-xl overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-800 text-sm">
              Escala de dolor: {info.nombre} ({info.rango})
            </p>
            <p className="text-xs text-blue-500 mt-0.5">{info.descripcion}</p>
          </div>
          {scoreDolor !== undefined && (
            <button
              type="button"
              onClick={() => setScoreDolor(undefined)}
              className="text-xs text-blue-400 hover:text-blue-600"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="p-4">
          {/* Wong-Baker: botones con caras descriptivas */}
          {escala === "wong_baker" && (
            <div className="grid grid-cols-3 gap-2">
              {WONG_BAKER_OPCIONES.map(({ valor, descripcion }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setScoreDolor(valor)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    scoreDolor === valor
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <p className="text-xl font-bold">{valor}</p>
                  <p className="text-xs mt-1">{descripcion}</p>
                </button>
              ))}
            </div>
          )}

          {/* Numérica, FLACC, NIPS: botones 0 a max */}
          {escala !== "wong_baker" && (
            <>
              {escala === "flacc" && (
                <p className="text-xs text-gray-400 mb-3">
                  F-cara · L-piernas · A-actividad · C-llanto · C-consolabilidad · Cada categoría 0-2
                </p>
              )}
              {escala === "nips" && (
                <p className="text-xs text-gray-400 mb-3">
                  Expresión facial · Llanto · Respiración · Brazos · Piernas · Estado de alerta · 0=sin dolor, 7=máximo
                </p>
              )}
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: maxScore + 1 }, (_, i) => i).map((n) => {
                  const color =
                    n <= 3 ? "bg-green-100 border-green-300 text-green-700"
                    : n <= 6 ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                    : "bg-red-100 border-red-300 text-red-700";
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScoreDolor(n)}
                      className={`w-9 h-9 rounded-lg border-2 text-sm font-bold transition-all ${
                        scoreDolor === n
                          ? color + " ring-2 ring-offset-1 ring-blue-400"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {scoreDolor !== undefined && (
            <div className={`mt-3 text-sm font-medium px-3 py-2 rounded-lg ${
              scoreDolor <= 3 ? "bg-green-50 text-green-700"
              : scoreDolor <= 6 ? "bg-yellow-50 text-yellow-700"
              : "bg-red-50 text-red-700"
            }`}>
              Score {info.nombre}: {scoreDolor}/{maxScore} —{" "}
              {scoreDolor === 0 ? "Sin dolor"
                : scoreDolor <= 3 ? "Dolor leve"
                : scoreDolor <= 6 ? "Dolor moderado"
                : "Dolor severo"}
            </div>
          )}
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
