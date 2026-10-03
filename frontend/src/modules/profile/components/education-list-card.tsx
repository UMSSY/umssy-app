import { Button } from "@/components/ui/button";
import type { EducationListCardProps } from "../types/education-list-card-props.types";
import { SectionCard } from "./section-card";

const ACTION_BUTTON_CLASS = "h-8 px-2 text-[13px] font-semibold";

export function EducationListCard({ educations }: EducationListCardProps) {
  return (
    <SectionCard
      title="Formación registrada"
      description="Puedes agregar varias entradas y actualizar cada una."
    >
      <ul className="divide-y divide-border">
        {educations.map((education) => (
          <li key={education.id} className="flex items-center justify-between gap-4 py-4 first:pt-0">
            <div>
              <h3 className="text-[15px] font-bold text-ink">{education.degree}</h3>
              <p className="mt-0.5 text-[13px] text-text-secondary">
                {education.institution} · {education.periodLabel}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                aria-label={`Editar ${education.degree}`}
                className={`${ACTION_BUTTON_CLASS} text-ink`}
              >
                Editar
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Eliminar ${education.degree}`}
                className={`${ACTION_BUTTON_CLASS} text-accent hover:bg-interaction hover:text-accent`}
              >
                Eliminar
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-border pt-4 text-[13px] text-text-secondary">
        Los nuevos estudios aparecerán aquí después de guardar.
      </p>
    </SectionCard>
  );
}
