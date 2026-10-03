"use client";

import { useState } from "react";
import { useCreateAvailabilityBlock } from "../hooks/use-create-availability-block";
import type { CreateAvailabilityBlockInput } from "../types/availability";

const EMPTY_FORM: CreateAvailabilityBlockInput = { startAt: "", endAt: "" };

export function NewAvailabilityView() {
  const { createBlock, isSubmitting, error: createError } = useCreateAvailabilityBlock();
  const [formData, setFormData] = useState<CreateAvailabilityBlockInput>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.startAt || !formData.endAt) {
      return "Todos los campos obligatorios deben completarse";
    }
    const start = new Date(formData.startAt).getTime();
    const end = new Date(formData.endAt).getTime();
    if (end <= start) {
      return "La hora de fin debe ser posterior a la hora de inicio";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(false);

    const formError = validateForm();
    setValidationError(formError);
    if (formError) return;

    const result = await createBlock(formData);

    if (result) {
      setSubmitSuccess(true);
      setFormData(EMPTY_FORM);
    }
  };

  const submitError = validationError ?? createError;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Crear Nuevo Bloque de Disponibilidad</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="startAt" className="block text-sm font-medium mb-1">Hora de Inicio</label>
          <input
            type="datetime-local"
            id="startAt"
            data-testid="startAt-input"
            name="startAt"
            value={formData.startAt}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="endAt" className="block text-sm font-medium mb-1">Hora de Fin</label>
          <input
            type="datetime-local"
            id="endAt"
            data-testid="endAt-input"
            name="endAt"
            value={formData.endAt}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        {submitError && <p className="text-red-500">{submitError}</p>}
        {submitSuccess && <p className="text-green-500">¡Bloque de disponibilidad creado exitosamente!</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isSubmitting ? "Creando..." : "Crear"}
        </button>
      </form>
    </div>
  );
}
