import { ArrowDown, Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkExperienceListCardProps } from "../types/work-experience-list-card-props.types";
import { formatWorkPeriod } from "../utils/format-work-period";
import { groupWorkExperiences } from "../utils/group-work-experiences";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/modules/profile";

export function WorkExperienceListCard({
  experiences = [],
  isLoading = false,
  isBusy = false,
  onAdd,
  onEdit,
  onDelete,
}: WorkExperienceListCardProps) {
  const groups = groupWorkExperiences(experiences);

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-sm text-text-secondary">Cargando experiencia laboral...</p>;
    }

    if (groups.length === 0) {
      return <p className="text-sm text-text-secondary">Aún no registraste experiencia laboral.</p>;
    }

    return (
      <ul className="relative divide-y divide-border">
        {groups.map((group) => (
          <li key={group.positions[0].id} className="group/timeline relative flex items-start gap-4 py-6 first:pt-0 last:pb-0">
            <span aria-hidden="true" className="absolute top-12 -bottom-6 left-6 border-l border-border-strong group-last/timeline:hidden" />
            <ArrowDown aria-hidden="true" className="absolute bottom-1 left-4 hidden size-4 text-accent group-last/timeline:block" />
            <div aria-hidden="true" className="relative flex size-12 shrink-0 items-center justify-center rounded-md bg-interaction text-accent"><Building2 className="size-6" strokeWidth={1.5} /></div>
            <div className="min-w-0 flex-1">
              {group.positions.length > 1 ? <h3 className="mb-5 text-lg font-bold wrap-anywhere text-ink">{group.companyName}</h3> : null}
              <ol className="space-y-5">
                {group.positions.map((experience) => {
                  const Heading = group.positions.length > 1 ? "h4" : "h3";
                  return <li key={experience.id} className={cn("group/position relative", group.positions.length > 1 && "ml-2 pl-6")}>
                    {group.positions.length > 1 ? <><span aria-hidden="true" className="absolute top-2 -bottom-7 left-0 border-l border-border-strong group-last/position:hidden" /><span aria-hidden="true" className="absolute top-2 -left-1 size-2 rounded-full bg-accent" /></> : null}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <Heading className="text-base font-bold wrap-anywhere text-ink">{experience.position}</Heading>
                        {group.positions.length === 1 ? <p className="mt-1 text-sm wrap-anywhere text-ink-soft">{experience.companyName}</p> : null}
                        <p className="mt-1 text-sm text-text-secondary">{formatWorkPeriod(experience.startDate, experience.endDate, experience.isCurrent)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button type="button" variant="ghost" aria-label={`Editar ${experience.position}`} className="size-9 p-0 text-ink-soft" disabled={isBusy} onClick={() => onEdit?.(experience)}><Pencil className="size-4" aria-hidden="true" /></Button>
                        <Button type="button" variant="ghost" aria-label={`Eliminar ${experience.position}`} className="size-9 p-0 text-danger hover:bg-brand-red/10 hover:text-danger" disabled={isBusy} onClick={() => onDelete?.(experience)}><Trash2 className="size-4" aria-hidden="true" /></Button>
                      </div>
                    </div>
                    {experience.description ? <p className="mt-3 max-w-prose text-sm leading-relaxed wrap-anywhere whitespace-pre-line text-ink-soft">{experience.description}</p> : null}
                  </li>;
                })}
              </ol>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <SectionCard title="Experiencia laboral" action={onAdd ? <Button variant="outline" size="sm" onClick={onAdd} disabled={isBusy}><Plus aria-hidden="true" />Añadir experiencia</Button> : null}>
      {renderContent()}
    </SectionCard>
  );
}
