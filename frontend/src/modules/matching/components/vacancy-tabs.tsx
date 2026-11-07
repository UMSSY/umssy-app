"use client";

import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

interface VacancyTabsProps {
  vacancies: { id: string; title: string }[];
  activeVacancyId: string;
  onChange: (vacancyId: string) => void;
}

export function VacancyTabs({ vacancies, activeVacancyId, onChange }: VacancyTabsProps) {
  return <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-soft p-4"><Label htmlFor="matching-vacancy">Vacante activa</Label><NativeSelect id="matching-vacancy" value={activeVacancyId} onChange={(event) => onChange(event.target.value)}>{vacancies.map((vacancy) => <NativeSelectOption key={vacancy.id} value={vacancy.id}>{vacancy.title}</NativeSelectOption>)}</NativeSelect><span className="ml-auto text-xs text-text-secondary">Los candidatos se muestran para esta vacante.</span></div>;
}
