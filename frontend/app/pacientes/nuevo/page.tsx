"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Paciente } from "@/types";
import Sidebar from "@/components/Sidebar";

interface FormData {
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  sexo: "masculino" | "femenino";
  documento?: string;
  telefono_contacto?: string;
  observaciones?: string;
}

export default function NuevoPacientePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    setError("");
    setLoading(true);
    try {
      const p = await api.post<Paciente>("/pacientes/", data);
      router.push(`/triaje/nuevo`);
      void p;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-xl mx-auto">
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/pacientes" className="hover:text-gray-600">Pacientes</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Nuevo</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Registrar paciente</h1>

          <div className="card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre *</label>
                  <input className="input" {...register("nombre", { required: "Requerido" })} />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
                </div>
                <div>
                  <label className="label">Apellido *</label>
                  <input className="input" {...register("apellido", { required: "Requerido" })} />
                  {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fecha de nacimiento *</label>
                  <input type="date" className="input" {...register("fecha_nacimiento", { required: "Requerido" })} />
                  {errors.fecha_nacimiento && <p className="text-red-500 text-xs mt-1">{errors.fecha_nacimiento.message}</p>}
                </div>
                <div>
                  <label className="label">Sexo *</label>
                  <select className="input" {...register("sexo", { required: "Requerido" })}>
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </select>
                  {errors.sexo && <p className="text-red-500 text-xs mt-1">{errors.sexo.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Documento</label>
                  <input className="input" placeholder="DNI / Pasaporte" {...register("documento")} />
                </div>
                <div>
                  <label className="label">Teléfono de contacto</label>
                  <input type="tel" className="input" {...register("telefono_contacto")} />
                </div>
              </div>

              <div>
                <label className="label">Observaciones</label>
                <textarea rows={3} className="input resize-none" {...register("observaciones")} />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Link href="/pacientes" className="btn-secondary flex-1 text-center">
                  Cancelar
                </Link>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? "Guardando..." : "Registrar paciente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
