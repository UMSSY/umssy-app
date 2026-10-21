"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Vacancy } from "../types/matching-types";

interface VacancyTabsProps {
  vacancies: Vacancy[];
  activeVacancyId: string;
  onChange: (vacancyId: string) => void;
}

export function VacancyTabs({ vacancies, activeVacancyId, onChange }: VacancyTabsProps) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Vacante activa
      </span>
      <div className="flex flex-wrap gap-1.5">
        {vacancies.map((vacancy) => (
          <Button
            unstyled
            key={vacancy.id}
            type="button"
            onClick={() => onChange(vacancy.id)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              vacancy.id === activeVacancyId
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {vacancy.title}
          </Button>
        ))}
      </div>
    </div>
  );
}
