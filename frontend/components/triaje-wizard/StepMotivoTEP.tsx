"use client";
import { useForm } from "react-hook-form";
import type { EvaluacionTEP } from "@/types";

interface FormData {
  motivo_consulta: string;
  apariencia_normal: boolean;
  apariencia_detalle: string;
  respiracion_normal: boolean;
  respiracion_detalle: string;
  circulacion_normal: boolean;
  circulacion_detalle: string;
}

interface Props {
  defaultValues?: Partial<FormData>;
  onNext: (data: { motivo: string; tep: EvaluacionTEP }) => void;
}

const TEP_ITEMS = [
  {
    key: "apariencia",
    label: "Apariencia",
    icon: "👁️",
    desc: "Tono, interacción, consolabilidad, mirada, habla/llanto",
  },
  {
    key: "respiracion",
    label: "Respiración",
    icon: "🫁",
    desc: "Sonidos anormales, posición anómala, retracciones, aleteo nasal",
  },
  {
    key: "circulacion",
    label: "Circulación",
    icon: "🩸",
    desc: "Palidez, moteado, cianosis, hemorragia visible",
  },
] as const;

export default function StepMotivoTEP({ defaultValues, onNext }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      apariencia_normal: true,
      respiracion_normal: true,
      circulacion_normal: true,
      ...defaultValues,
    },
  });

  function onSubmit(data: FormData) {
    onNext({
      motivo: data.motivo_consulta,
      tep: {
        apariencia_normal: data.apariencia_normal,
        apariencia_detalle: data.apariencia_detalle,
        respiracion_normal: data.respiracion_normal,
        respiracion_detalle: data.respiracion_detalle,
        circulacion_normal: data.circulacion_normal,
        circulacion_detalle: data.circulacion_detalle,
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Motivo de consulta */}
      <div>
        <label className="label">Motivo de consulta *</label>
        <textarea
          rows={3}
          className="input resize-none"
          placeholder="Describa el motivo de consulta del paciente..."
          {...register("motivo_consulta", { required: "El motivo de consulta es requerido" })}
        />
        {errors.motivo_consulta && (
          <p className="text-red-500 text-xs mt-1">{errors.motivo_consulta.message}</p>
        )}
      </div>

      {/* TEP */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-1">
          Triángulo de Evaluación Pediátrica (TEP)
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Evaluación visual rápida — marcar si está <strong>alterado</strong>
        </p>

        <div className="space-y-4">
          {TEP_ITEMS.map(({ key, label, icon, desc }) => {
            const normalKey = `${key}_normal` as keyof FormData;
            const detailKey = `${key}_detalle` as keyof FormData;
            const isNormal = watch(normalKey) as boolean;

            return (
              <div
                key={key}
                className={`border rounded-xl p-4 transition-colors ${
                  isNormal ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className="font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className={`text-sm font-medium ${isNormal ? "text-green-700" : "text-red-700"}`}>
                      {isNormal ? "Normal" : "Alterado"}
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        {...register(normalKey as "apariencia_normal" | "respiracion_normal" | "circulacion_normal")}
                      />
                      <div
                        className={`w-12 h-6 rounded-full transition-colors ${
                          isNormal ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          isNormal ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </div>
                  </label>
                </div>

                {!isNormal && (
                  <div className="mt-3">
                    <input
                      className="input text-sm"
                      placeholder={`Describe la alteración en ${label.toLowerCase()}...`}
                      {...register(detailKey as "apariencia_detalle" | "respiracion_detalle" | "circulacion_detalle")}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button type="submit" className="btn-primary w-full">
        Continuar → Signos Vitales
      </button>
    </form>
  );
}
