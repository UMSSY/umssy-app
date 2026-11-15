"use client";
import type { VacancyTabsProps } from "../types/vacancy-tabs-props.types";

import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export function VacancyTabs({
  vacancies,
  activeVacancyId,
  onChange,
}: VacancyTabsProps) {
  return (
    <div className="flex min-w-0 flex-col items-stretch gap-3 rounded-lg border border-border bg-surface-soft p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <Label htmlFor="matching-vacancy">Vacante activa</Label>
      <NativeSelect
        id="matching-vacancy"
        className="w-full min-w-0 sm:w-auto sm:max-w-full"
        value={activeVacancyId}
        onChange={(event) => onChange(event.target.value)}
      >
        {vacancies.map((vacancy) => (
          <NativeSelectOption key={vacancy.id} value={vacancy.id}>
            {vacancy.title}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <span className="text-xs text-text-secondary sm:ml-auto">
        Los candidatos se muestran para esta vacante.
      </span>
    </div>
  );
}
