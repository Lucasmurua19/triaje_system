"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Paciente, EvaluacionTEP, SignosVitales, FactoresRiesgo, Triaje } from "@/types";
import StepPaciente from "@/components/triaje-wizard/StepPaciente";
import StepMotivoTEP from "@/components/triaje-wizard/StepMotivoTEP";
import StepSignosVitales from "@/components/triaje-wizard/StepSignosVitales";
import StepFactoresRiesgo from "@/components/triaje-wizard/StepFactoresRiesgo";
import Sidebar from "@/components/Sidebar";

const PASOS = [
  "Paciente",
  "Motivo y TEP",
  "Signos Vitales",
  "Factores de Riesgo",
];

export default function NuevoTriajePage() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [motivo, setMotivo] = useState("");
  const [tep, setTep] = useState<EvaluacionTEP | null>(null);
  const [sv, setSv] = useState<SignosVitales | null>(null);

  async function finalizar(fr: FactoresRiesgo) {
    if (!paciente || !tep || !sv) return;
    setError("");
    setLoading(true);
    try {
      const result = await api.post<Triaje>("/triaje/", {
        paciente_id: paciente.id,
        motivo_consulta: motivo,
        signos_vitales: sv,
        evaluacion_tep: tep,
        factores_riesgo: fr,
      });
      router.push(`/triaje/${result.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar el triaje");
      setLoading(false);
    }
  }

  function calcularEdadMeses(fechaNac: string) {
    return (
      (new Date().getFullYear() - new Date(fechaNac).getFullYear()) * 12 +
      (new Date().getMonth() - new Date(fechaNac).getMonth())
    );
  }

  function calcularEdad(fechaNac: string) {
    const meses = calcularEdadMeses(fechaNac);
    return meses < 24 ? `${meses} meses` : `${Math.floor(meses / 12)} años`;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Triaje</h1>
            <p className="text-gray-500 text-sm mt-1">Complete los 4 pasos para clasificar al paciente</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-0 mb-8">
            {PASOS.map((nombre, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                      i < paso
                        ? "bg-blue-600 border-blue-600 text-white"
                        : i === paso
                        ? "bg-white border-blue-600 text-blue-600"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {i < paso ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${i === paso ? "text-blue-600" : "text-gray-400"}`}>
                    {nombre}
                  </span>
                </div>
                {i < PASOS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 mb-4 ${i < paso ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Paciente seleccionado (persistente) */}
          {paciente && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-800">
                  {paciente.apellido}, {paciente.nombre}
                </p>
                <p className="text-sm text-blue-600">
                  {calcularEdad(paciente.fecha_nacimiento)} · {paciente.sexo}
                  {paciente.documento ? ` · Doc: ${paciente.documento}` : ""}
                </p>
              </div>
              {paso === 0 && (
                <button
                  onClick={() => setPaciente(null)}
                  className="text-blue-400 hover:text-blue-700 text-sm"
                >
                  Cambiar
                </button>
              )}
            </div>
          )}

          {/* Card del paso actual */}
          <div className="card">
            {paso === 0 && (
              <StepPaciente
                onSelect={(p) => {
                  setPaciente(p);
                  setPaso(1);
                }}
              />
            )}
            {paso === 1 && (
              <StepMotivoTEP
                onNext={({ motivo: m, tep: t }) => {
                  setMotivo(m);
                  setTep(t);
                  setPaso(2);
                }}
              />
            )}
            {paso === 2 && (
              <StepSignosVitales
                onNext={(data) => {
                  setSv(data);
                  setPaso(3);
                }}
                onBack={() => setPaso(1)}
                edadMeses={paciente ? calcularEdadMeses(paciente.fecha_nacimiento) : undefined}
              />
            )}
            {paso === 3 && (
              <StepFactoresRiesgo
                onSubmit={finalizar}
                onBack={() => setPaso(2)}
                loading={loading}
              />
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
