"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  INPUT_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXTAREA_CLASS,
} from "../config/form-styles.config";
import { FormField } from "./form-field";
import { SectionCard } from "./section-card";

export function EducationForm() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <SectionCard title="Agregar formación">
      <form
        aria-label="Agregar formación"
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        <FormField id="education-institution" label="Institución" isRequired>
          <input
            id="education-institution"
            name="institution"
            type="text"
            required
            placeholder="Nombre de la institución"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField id="education-degree" label="Título o carrera" isRequired>
          <input
            id="education-degree"
            name="degree"
            type="text"
            required
            placeholder="Ej. Licenciatura en Informática"
            className={INPUT_CLASS}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-5">
          <FormField id="education-startDate" label="Desde" isRequired>
            <input
              id="education-startDate"
              name="startDate"
              type="text"
              required
              placeholder="Mes y año"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField id="education-endDate" label="Hasta" isRequired>
            <input
              id="education-endDate"
              name="endDate"
              type="text"
              required
              placeholder="Mes y año"
              className={INPUT_CLASS}
            />
          </FormField>
        </div>
        <FormField id="education-description" label="Descripción (opcional)">
          <textarea
            id="education-description"
            name="description"
            rows={3}
            placeholder="Agrega un detalle relevante de tus estudios"
            className={TEXTAREA_CLASS}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" className={SECONDARY_BUTTON_CLASS}>
            Cancelar
          </Button>
          <Button type="submit" className={cn(PRIMARY_BUTTON_CLASS, "min-w-44")}>
            Guardar formación
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
