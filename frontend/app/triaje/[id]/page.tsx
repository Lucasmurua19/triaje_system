"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Triaje, SepsisResumen, Paciente } from "@/types";
import NivelBadge from "@/components/NivelBadge";
import SepsisAlert from "@/components/SepsisAlert";
import AccionesTriaje from "@/components/AccionesTriaje";
import Sidebar from "@/components/Sidebar";

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value ?? "—"}</span>
    </div>
  );
}

export default function TriajeDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [triaje, setTriaje] = useState<Triaje | null>(null);
  const [sepsis, setSepsis] = useState<SepsisResumen | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Triaje>(`/triaje/${id}`),
      api.get<SepsisResumen>(`/triaje/${id}/sepsis`),
    ])
      .then(async ([t, s]) => {
        setTriaje(t);
        setSepsis(s);
        const p = await api.get<Paciente>(`/pacientes/${t.paciente_id}`).catch(() => null);
        setPaciente(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-lg">Cargando triaje...</p>
        </main>
      </div>
    );
  }

  if (!triaje) return null;
  const sv = triaje.signos_vitales;
  const tep = triaje.evaluacion_tep;
  const fr = triaje.factores_riesgo;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-gray-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Triaje #{triaje.id}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Triaje #{triaje.id}</h1>
                <NivelBadge nivel={triaje.nivel as 1 | 2 | 3 | 4 | 5 | undefined} />
              </div>
              <p className="text-gray-500 text-sm">
                {new Date(triaje.fecha).toLocaleString("es-AR", {
                  weekday: "long", day: "2-digit", month: "long",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
            {triaje.tiempo_espera_minutos !== undefined && (
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-800">
                  {triaje.tiempo_espera_minutos === 0 ? "Inmediato" : `${triaje.tiempo_espera_minutos} min`}
                </p>
                <p className="text-xs text-gray-400">Tiempo de espera</p>
              </div>
            )}
          </div>

          {/* Alerta Sepsis — primero y prominente */}
          {sepsis && <SepsisAlert data={sepsis} />}

          {/* Motivo */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3">Motivo de consulta</h2>
            <p className="text-gray-700">{triaje.motivo_consulta}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Signos Vitales */}
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-3">Signos Vitales</h2>
              {sv ? (
                <>
                  <InfoRow label="FC" value={sv.frecuencia_cardiaca ? `${sv.frecuencia_cardiaca} lpm` : undefined} />
                  <InfoRow label="FR" value={sv.frecuencia_respiratoria ? `${sv.frecuencia_respiratoria} rpm` : undefined} />
                  <InfoRow label="Temperatura" value={sv.temperatura ? `${sv.temperatura} °C` : undefined} />
                  <InfoRow label="SatO₂" value={sv.saturacion_o2 ? `${sv.saturacion_o2}%` : undefined} />
                  <InfoRow
                    label="TA"
                    value={sv.tension_arterial_sistolica ? `${sv.tension_arterial_sistolica}/${sv.tension_arterial_diastolica} mmHg` : undefined}
                  />
                  <InfoRow label="Conciencia" value={sv.nivel_conciencia} />
                  <InfoRow label="Glasgow" value={sv.glasgow} />
                  <InfoRow label="Peso" value={sv.peso_kg ? `${sv.peso_kg} kg` : undefined} />
                  <InfoRow
                    label="Llene capilar"
                    value={sv.llene_capilar_segundos ? `${sv.llene_capilar_segundos} seg` : undefined}
                  />
                </>
              ) : (
                <p className="text-gray-400 text-sm">Sin datos</p>
              )}
            </div>

            {/* TEP y Factores */}
            <div className="space-y-6">
              <div className="card">
                <h2 className="font-semibold text-gray-800 mb-3">TEP</h2>
                {tep ? (
                  <>
                    <InfoRow label="Apariencia" value={tep.apariencia_normal ? "Normal" : `Alterada: ${tep.apariencia_detalle ?? ""}`} />
                    <InfoRow label="Respiración" value={tep.respiracion_normal ? "Normal" : `Alterada: ${tep.respiracion_detalle ?? ""}`} />
                    <InfoRow label="Circulación" value={tep.circulacion_normal ? "Normal" : `Alterada: ${tep.circulacion_detalle ?? ""}`} />
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">Sin datos</p>
                )}
              </div>

              <div className="card">
                <h2 className="font-semibold text-gray-800 mb-3">Factores de Riesgo</h2>
                {fr ? (
                  <div className="flex flex-wrap gap-2">
                    {fr.sospecha_infeccion && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">🦠 Inf. sospechada</span>}
                    {fr.edad_menor_3_meses && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">👶 &lt;3 meses</span>}
                    {fr.inmunosupresion && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">💊 Inmunosupresión</span>}
                    {fr.enfermedad_cronica && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">📋 Enf. crónica</span>}
                    {fr.reconsulta_72h && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">🔄 Reconsulta</span>}
                    {fr.dolor_severo && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">😣 Dolor severo</span>}
                    {!Object.values(fr).some(Boolean) && <span className="text-gray-400 text-sm">Sin factores</span>}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Sin datos</p>
                )}
              </div>
            </div>
          </div>

          {/* Antecedentes del paciente */}
          {paciente && (paciente.alergias || paciente.enfermedades_cronicas || paciente.medicacion_habitual || paciente.antecedentes_quirurgicos || paciente.grupo_sanguineo) && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800">Antecedentes del paciente</h2>
                <Link href={`/pacientes/${paciente.id}`} className="text-xs text-blue-600 hover:underline">
                  Editar →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-x-8">
                {paciente.grupo_sanguineo && (
                  <InfoRow label="Grupo sanguíneo" value={paciente.grupo_sanguineo} />
                )}
                {paciente.alergias && (
                  <div className="col-span-2 flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-red-500 font-medium">Alergias</span>
                    <span className="text-sm font-medium text-red-700 text-right max-w-xs">{paciente.alergias}</span>
                  </div>
                )}
                {paciente.enfermedades_cronicas && (
                  <div className="col-span-2 flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Enf. crónicas</span>
                    <span className="text-sm font-medium text-gray-800 text-right max-w-xs">{paciente.enfermedades_cronicas}</span>
                  </div>
                )}
                {paciente.medicacion_habitual && (
                  <div className="col-span-2 flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Medicación habitual</span>
                    <span className="text-sm font-medium text-gray-800 text-right max-w-xs">{paciente.medicacion_habitual}</span>
                  </div>
                )}
                {paciente.antecedentes_quirurgicos && (
                  <div className="col-span-2 flex justify-between py-2">
                    <span className="text-sm text-gray-500">Antec. quirúrgicos</span>
                    <span className="text-sm font-medium text-gray-800 text-right max-w-xs">{paciente.antecedentes_quirurgicos}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acciones de enfermería */}
          <AccionesTriaje triajeId={triaje.id} acciones={triaje.acciones ?? []} />

          <div className="flex gap-3">
            <Link href="/dashboard" className="btn-secondary">
              ← Volver al dashboard
            </Link>
            <Link href="/triaje/nuevo" className="btn-primary">
              Nuevo triaje
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
