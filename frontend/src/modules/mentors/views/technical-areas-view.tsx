"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { TechnicalAreaCard } from "../components/technical-area-card";
import {
  MOCK_MENTOR_AREA_IDS,
  MOCK_TECHNICAL_AREAS,
  saveMentorAreas,
} from "../services/technical-areas.mock";
import type { TechnicalAreasViewProps } from "../types/technical-area.types";

export function TechnicalAreasView({ mode }: TechnicalAreasViewProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";
  const initialIds = isEditMode ? MOCK_MENTOR_AREA_IDS : [];

  const [savedIds, setSavedIds] = useState<number[]>(initialIds);
  const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [toast, setToast] = useState<{ isError: boolean; text: string } | null>(
    null,
  );

  const hasChanges =
    selectedIds.length !== savedIds.length ||
    selectedIds.some((id) => !savedIds.includes(id));
  const hasNoSelection = selectedIds.length === 0;

  const handleToggleArea = (id: number) =>
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );

  const showToast = (isError: boolean, text: string) => {
    setToast({ isError, text });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    if (hasNoSelection) return;

    // Paso 2 del registro: solo avanza al Paso 3
    if (!isEditMode) {
      router.push("/mentors/register/guidance");
      return;
    }

    setIsSaving(true);
    try {
      await saveMentorAreas(selectedIds);
      setSavedIds(selectedIds);
      showToast(false, "Áreas técnicas actualizadas correctamente");
    } catch {
      showToast(true, "No se pudieron guardar los cambios. Intente nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => {
    if (isEditMode && hasChanges) setIsDiscardModalOpen(true);
    else router.push("/mentors/participation");
  };

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      <nav className="mb-4 text-sm text-gray-500">
        UMSSY &gt; Mentorías &gt; Mi participación &gt;{" "}
        <span className="font-medium text-gray-800">Áreas técnicas</span>
      </nav>

      <h1 className="text-2xl font-bold">
        {isEditMode ? "Editar áreas técnicas" : "Selecciona tus áreas técnicas"}
      </h1>
      <p className="mb-4 text-gray-600">
        Indica las áreas en las que tienes experiencia y puedes brindar
        orientación.
      </p>

      {hasNoSelection ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
        >
          Debe seleccionarse al menos un área para continuar
        </div>
      ) : (
        <div className="mb-4 rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
          {selectedIds.length} seleccionadas
        </div>
      )}

      {/* 1 columna en móvil, 2 en tablet (768px) y 3 en escritorio (1024px) */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_TECHNICAL_AREAS.map((area) => (
          <TechnicalAreaCard
            key={area.id}
            area={area}
            isSelected={selectedIds.includes(area.id)}
            onToggle={handleToggleArea}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleGoBack}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={hasNoSelection || isSaving}
          className="flex items-center gap-2 rounded-lg bg-[#DC2626] px-6 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            "Guardando..."
          ) : isEditMode ? (
            <>
              <Save size={16} /> Guardar cambios
            </>
          ) : (
            <>
              Continuar <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 rounded-lg px-4 py-3 text-white shadow-lg ${
            toast.isError ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.text}
        </div>
      )}

      {isDiscardModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h2 className="mb-2 text-lg font-bold">¿Descartar cambios?</h2>
            <p className="mb-4 text-sm text-gray-600">
              Tienes cambios sin guardar. Si sales, se perderán.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDiscardModalOpen(false)}
                className="rounded-lg border px-4 py-2"
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={() => router.push("/mentors/participation")}
                className="rounded-lg bg-[#DC2626] px-4 py-2 text-white"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}