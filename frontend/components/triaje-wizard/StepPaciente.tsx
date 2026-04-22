"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import type { Paciente } from "@/types";

interface Props {
  onSelect: (paciente: Paciente) => void;
}

interface NuevoPacienteForm {
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  sexo: "masculino" | "femenino";
  documento?: string;
  telefono_contacto?: string;
  grupo_sanguineo?: string;
  alergias?: string;
  enfermedades_cronicas?: string;
  medicacion_habitual?: string;
  antecedentes_quirurgicos?: string;
}

const GRUPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function StepPaciente({ onSelect }: Props) {
  const [modo, setModo] = useState<"buscar" | "nuevo">("buscar");
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Paciente[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [mostrarAntecedentes, setMostrarAntecedentes] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<NuevoPacienteForm>();

  async function buscar() {
    if (!busqueda.trim()) return;
    setBuscando(true);
    try {
      const data = await api.get<Paciente[]>(`/pacientes/?busqueda=${encodeURIComponent(busqueda)}`);
      setResultados(data);
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  async function crearPaciente(data: NuevoPacienteForm) {
    setErrorForm("");
    setGuardando(true);
    try {
      const paciente = await api.post<Paciente>("/pacientes/", data);
      onSelect(paciente);
    } catch (e: unknown) {
      setErrorForm(e instanceof Error ? e.message : "Error al crear paciente");
    } finally {
      setGuardando(false);
    }
  }

  function calcularEdad(fechaNac: string) {
    const hoy = new Date();
    const nac = new Date(fechaNac);
    const meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
    if (meses < 24) return `${meses} meses`;
    return `${Math.floor(meses / 12)} años`;
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["buscar", "nuevo"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModo(m)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              modo === m
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {m === "buscar" ? "Buscar paciente" : "Registrar nuevo"}
          </button>
        ))}
      </div>

      {modo === "buscar" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Nombre, apellido o documento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <button onClick={buscar} disabled={buscando} className="btn-primary">
              {buscando ? "..." : "Buscar"}
            </button>
          </div>

          {resultados.length > 0 && (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {resultados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">
                    {p.apellido}, {p.nombre}
                  </p>
                  <p className="text-sm text-gray-500">
                    {calcularEdad(p.fecha_nacimiento)} · {p.sexo} · Doc: {p.documento ?? "—"}
                    {p.grupo_sanguineo && ` · ${p.grupo_sanguineo}`}
                  </p>
                  {p.alergias && (
                    <p className="text-xs text-red-600 mt-0.5 font-medium">
                      Alergias: {p.alergias}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {resultados.length === 0 && busqueda && !buscando && (
            <p className="text-gray-400 text-sm text-center py-4">
              Sin resultados.{" "}
              <button onClick={() => setModo("nuevo")} className="text-blue-600 underline">
                Registrar nuevo paciente
              </button>
            </p>
          )}
        </div>
      )}

      {modo === "nuevo" && (
        <form onSubmit={handleSubmit(crearPaciente)} className="space-y-4">
          {/* Datos básicos */}
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
              <input className="input" type="tel" {...register("telefono_contacto")} />
            </div>
          </div>

          {/* Antecedentes médicos — colapsable */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setMostrarAntecedentes(!mostrarAntecedentes)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>Antecedentes médicos</span>
              <span className="text-gray-400 text-xs">{mostrarAntecedentes ? "▲ Ocultar" : "▼ Expandir"}</span>
            </button>

            {mostrarAntecedentes && (
              <div className="p-4 space-y-4">
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
                    <span className="ml-1 text-xs text-red-500 font-normal">(importante para prescripción)</span>
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
            )}
          </div>

          {errorForm && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errorForm}
            </div>
          )}

          <button type="submit" disabled={guardando} className="btn-primary w-full">
            {guardando ? "Guardando..." : "Registrar y continuar"}
          </button>
        </form>
      )}
    </div>
  );
}
