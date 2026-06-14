"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import type { Paciente } from "@/types";
import Sidebar from "@/components/Sidebar";

const GRUPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface FormData {
  telefono_contacto?: string;
  observaciones?: string;
  grupo_sanguineo?: string;
  alergias?: string;
  enfermedades_cronicas?: string;
  medicacion_habitual?: string;
  antecedentes_quirurgicos?: string;
}

function calcularEdad(fechaNac: string) {
  const meses =
    (new Date().getFullYear() - new Date(fechaNac).getFullYear()) * 12 +
    (new Date().getMonth() - new Date(fechaNac).getMonth());
  return meses < 24 ? `${meses} meses` : `${Math.floor(meses / 12)} años`;
}

export default function PacienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, reset } = useForm<FormData>();

  useEffect(() => {
    api.get<Paciente>(`/pacientes/${id}`)
      .then((p) => {
        setPaciente(p);
        reset({
          telefono_contacto: p.telefono_contacto ?? "",
          observaciones: p.observaciones ?? "",
          grupo_sanguineo: p.grupo_sanguineo ?? "",
          alergias: p.alergias ?? "",
          enfermedades_cronicas: p.enfermedades_cronicas ?? "",
          medicacion_habitual: p.medicacion_habitual ?? "",
          antecedentes_quirurgicos: p.antecedentes_quirurgicos ?? "",
        });
      })
      .catch(() => setError("No se pudo cargar el paciente"))
      .finally(() => setLoading(false));
  }, [id, reset]);

  async function guardar(data: FormData) {
    setGuardando(true);
    setExito(false);
    setError("");
    try {
      const updated = await api.put<Paciente>(`/pacientes/${id}`, data);
      setPaciente(updated);
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Cargando...</p>
        </main>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-red-500">{error || "Paciente no encontrado"}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/pacientes" className="hover:text-gray-600">Pacientes</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{paciente.apellido}, {paciente.nombre}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {paciente.apellido}, {paciente.nombre}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {calcularEdad(paciente.fecha_nacimiento)} · {paciente.sexo}
                {paciente.documento && ` · DNI ${paciente.documento}`}
              </p>
            </div>
            <Link
              href={`/triaje/nuevo?paciente=${paciente.id}`}
              className="btn-primary text-sm"
            >
              Nuevo triaje
            </Link>
          </div>

          {/* Datos fijos (no editables) */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3">Datos de identificación</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Fecha de nacimiento</p>
                <p className="font-medium text-gray-800">
                  {new Date(paciente.fecha_nacimiento).toLocaleDateString("es-AR")}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Sexo</p>
                <p className="font-medium text-gray-800 capitalize">{paciente.sexo}</p>
              </div>
              <div>
                <p className="text-gray-400">Documento</p>
                <p className="font-medium text-gray-800">{paciente.documento ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-400">Registrado</p>
                <p className="font-medium text-gray-800">
                  {new Date(paciente.created_at).toLocaleDateString("es-AR")}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario editable */}
          <form onSubmit={handleSubmit(guardar)} className="space-y-6">
            {/* Contacto */}
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-800">Contacto</h2>
              <div>
                <label className="label">Teléfono de contacto</label>
                <input className="input" type="tel" {...register("telefono_contacto")} />
              </div>
              <div>
                <label className="label">Observaciones generales</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  {...register("observaciones")}
                />
              </div>
            </div>

            {/* Antecedentes médicos */}
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-800">Antecedentes médicos</h2>

              <div>
                <label className="label">Grupo sanguíneo</label>
                <select className="input" {...register("grupo_sanguineo")}>
                  <option value="">Desconocido</option>
                  {GRUPOS_SANGUINEOS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  Alergias
                  <span className="ml-1 text-xs text-red-500 font-normal">(relevante para prescripción)</span>
                </label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Ej: Penicilina, aspirina, látex..."
                  {...register("alergias")}
                />
              </div>

              <div>
                <label className="label">Enfermedades crónicas</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Ej: Asma, diabetes tipo 1, cardiopatía congénita..."
                  {...register("enfermedades_cronicas")}
                />
              </div>

              <div>
                <label className="label">Medicación habitual</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Ej: Salbutamol inhalado, insulina NPH..."
                  {...register("medicacion_habitual")}
                />
              </div>

              <div>
                <label className="label">Antecedentes quirúrgicos</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Ej: Apendicectomía 2022, corrección PCA 2020..."
                  {...register("antecedentes_quirurgicos")}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {exito && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Antecedentes guardados correctamente
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={guardando} className="btn-primary">
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
