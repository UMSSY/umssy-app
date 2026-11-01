
/* eslint-disable tailwindcss/classnames-order */
'use client';

import { BriefcaseBusiness } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/modules/profile';
import type { WorkExperienceListCardProps } from '../types/work-experience-list-card-props.types';
import { formatWorkPeriod } from '../utils/format-work-period';

export function WorkExperienceListCard({
  experiences = [],
  isLoading = false,
  isBusy = false,
  onAdd,
  onEdit,
  onDelete,
  skillsByExperience = {},
}: WorkExperienceListCardProps) {
  if (isLoading) {
    return (
      <section className="px-5 py-4 font-medium text-slate-700">
        Cargando experiencia laboral...
      </section>
    );
  }

  const safeExperiences = [...experiences].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  return (
    <SectionCard
      title="Experiencia laboral"
      action={
        onAdd ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            disabled={isBusy}
            className="shrink-0 gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            Añadir experiencia
          </Button>
        ) : null
      }
    >
      {safeExperiences.length === 0 ? (
        <section className="pt-2 text-sm italic text-slate-600">
          Aún no registraste experiencia laboral.
        </section>
      ) : (
        <ul className="mt-4 space-y-6">
          {safeExperiences.map((experience, index) => {
            const periodText = formatWorkPeriod(
              experience.startDate,
              experience.endDate,
              experience.isCurrent,
            );

            const skillsList = experience.id
              ? skillsByExperience[experience.id] ?? []
              : [];

            return (
              <li
                key={experience.id ?? index}
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <BriefcaseBusiness aria-hidden="true" className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="wrap-anywhere text-base font-semibold text-slate-900">
                        {experience.position}
                      </h4>
                      <p className="wrap-anywhere text-sm font-medium text-slate-700">
                        {experience.companyName}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {periodText}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(experience)}
                      aria-label={`Editar ${experience.position}`}
                      disabled={isBusy || !onEdit}
                      className="h-8 gap-1.5 border-slate-300 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Editar
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(experience)}
                      aria-label={`Eliminar ${experience.position}`}
                      disabled={isBusy || !onDelete}
                      className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>

                {experience.description && (
                  <p className="mt-3.5 whitespace-pre-line wrap-anywhere text-sm text-slate-700">
                    {experience.description}
                  </p>
                )}

                {skillsList.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <span className="mr-1 text-xs font-semibold text-slate-500">
                      Habilidades:
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {skillsList.map((skill) => (
                        <span
                          key={skill.toLowerCase()}
                          className="inline-flex items-center rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
