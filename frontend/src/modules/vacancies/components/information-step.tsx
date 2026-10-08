"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modality, VacancyConditions } from "../hooks/use-job-offer-form";

interface InformationStepProps {
  conditions: VacancyConditions;
  updateField: (field: keyof VacancyConditions, value: string) => void;
  selectModality: (modality: Modality) => void;
  onContinue: () => void;
}

const MODALITIES = ["Presencial", "Remoto", "Hibrido"];
const CONTRACT_TYPES = ["Tiempo completo", "Medio tiempo", "Pasantia"];

export function InformationStep({ conditions, updateField, selectModality, onContinue }: InformationStepProps) {
  const hasUnsavedChanges = 
    conditions.title !== "" || 
    conditions.salary !== "" || 
    conditions.mapsLink !== "" || 
    conditions.languages !== "" || 
    conditions.vacancyCount !== "" ||
    conditions.category !== "";

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; 
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const isConfirmed = window.confirm("¿Estás seguro de que deseas cancelar? Se perderán todos los datos ingresados.");
      if (!isConfirmed) return;
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    if (allowedKeys.includes(e.key)) return;

    const isAlphanumericOrSpace = /^[a-zA-Z0-9\sñÑáéíóúÁÉÍÓÚ]+$/.test(e.key);
    if (!isAlphanumericOrSpace || conditions.title.length >= 60) {
      e.preventDefault();
    }
  };

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    if (allowedKeys.includes(e.key)) return;

    const isNumber = /^[0-9]+$/.test(e.key);
    if (!isNumber) {
      e.preventDefault();
    }
  };

  const handleVacancyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      updateField("vacancyCount", "");
      return;
    }
    const num = parseInt(value, 10);
    if (num <= 500) {
      updateField("vacancyCount", num.toString());
    }
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d-]/g, "");
    if (!rawValue) {
      updateField("salary", "");
      return;
    }
    const parts = rawValue.split("-");
    const formatMiles = (numStr: string) => {
      if (!numStr) return "";
      const numero = parseInt(numStr, 10);
      if (isNaN(numero)) return "";
      return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };
    let formatted = "Bs " + formatMiles(parts[0]);
    if (parts.length > 1) {
      formatted += " - " + formatMiles(parts[1]);
    }
    updateField("salary", formatted);
  };

  const handleSalaryBlur = () => {
    if (!conditions.salary) return;
    const rawValue = conditions.salary.replace(/[^\d-]/g, "");
    const parts = rawValue.split("-");
    if (parts.length === 2 && parts[0] !== "" && parts[1] !== "") {
      const min = parseInt(parts[0], 10);
      const max = parseInt(parts[1], 10);
      if (min > max) {
        const formatMiles = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        updateField("salary", `Bs ${formatMiles(max)} - ${formatMiles(min)}`);
      }
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-[22px] font-bold text-ink">
          Informacion y condiciones de la oferta
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 px-6 py-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <div className="flex justify-between">
            <Label htmlFor="title" className="text-[12.5px] font-semibold">
              Titulo del puesto <span className="text-danger">*</span>
            </Label>
            <span className="text-[11px] text-slate-400">{conditions.title.length}/60</span>
          </div>
          <Input 
            id="title" 
            placeholder="Desarrollador Backend" 
            className="mt-1.5" 
            value={conditions.title} 
            onChange={(event) => updateField("title", event.target.value)}
            onKeyDown={handleTitleKeyDown}
          />
        </div>

        <div>
          <Label className="text-[12.5px] font-semibold">
            Modalidad  <span className="text-danger">*</span>
          </Label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {MODALITIES.map((modality) => (
              <button
                key={modality}
                type="button"
                onClick={() => selectModality(modality as Modality)}
                className={conditions.modality === modality 
                  ? "rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white" 
                  : "rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-soft"}
                >{modality}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="mapsLink" className="text-[12.5px] font-semibold">
            Enlace de Google Maps <span className="text-danger">*</span>
          </Label>
          <Input
            id="mapsLink"
            placeholder="https://maps.google.com/?q=..."
            className="mt-1.5"
            value={conditions.mapsLink} 
            onChange={(event) => updateField("mapsLink" , event.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="contractType" className="text-[12.5px] font-semibold">
            Tipo de contrato <span className="text-danger">*</span>
          </Label>
          <Select value={conditions.contractType} onValueChange={(value) => updateField("contractType", value ?? "")}>
            <SelectTrigger id="contractType" className="mt-1.5 w-full">
              <SelectValue  placeholder="Selecciona una opcion" />
            </SelectTrigger>
            <SelectContent>
              {CONTRACT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category" className="text-[12.5px] font-semibold">
            Categoria <span className="text-danger">*</span>
          </Label>
          <Input 
            id="category" 
            placeholder="Tecnologia" 
            className="mt-1.5" 
            value={conditions.category} 
            onChange={(event) => updateField("category", event.target.value)} 
          />
        </div>

        <div>
          <Label htmlFor="vacancyCount" className="text-[12.5px] font-semibold">
            Numero de vacantes <span className="text-danger">*</span>
          </Label>
          <Input 
            id="vacancyCount" 
            placeholder="1" 
            className="mt-1.5" 
            value={conditions.vacancyCount} 
            onChange={handleVacancyChange}
            onKeyDown={handleNumberKeyDown}
          />
        </div>

        <div>
          <Label htmlFor="salary" className="text-[12.5px] font-semibold">Salario</Label>
          <Input 
            id="salary" 
            placeholder="Bs 6.500 - 8.000" 
            className="mt-1.5" 
            value={conditions.salary} 
            onChange={handleSalaryChange}
            onBlur={handleSalaryBlur}
          />
        </div>

        <div>
          <Label htmlFor="languages" className="text-[12.5px] font-semibold">
            Idiomas <span className="text-danger">*</span>
          </Label>
          <Input 
            id="languages" 
            placeholder="Español, ingles intermedio" 
            className="mt-1.5"
            value={conditions.languages} 
            onChange={(event) => updateField("languages", event.target.value)} 
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-6 py-4">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-lg bg-[#E50000] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}