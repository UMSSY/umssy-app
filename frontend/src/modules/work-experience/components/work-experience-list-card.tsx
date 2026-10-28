
/* eslint-disable tailwindcss/classnames-order */
'use client';

import { BriefcaseBusiness, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkExperienceListCardProps } from '../types/work-experience-list-card-props.types';
import { formatWorkPeriod } from '../utils/format-work-period';

type Skill = string | { name: string };

type ExperienceWithSkills = {
  description?: string | null;
  skills?: unknown;
};

function getSkillNames(experience: ExperienceWithSkills): string[] {
  const rawSkills = experience.skills;

  const savedSkills: string[] = Array.isArray(rawSkills)
    ? rawSkills
        .map((skill: Skill | unknown) => {
          if (typeof skill === 'string') {
            return skill.trim();
          }

          if (
            typeof skill === 'object' &&
            skill !== null &&
            'name' in skill &&
            typeof skill.name === 'string'
          ) {
            return skill.name.trim();
          }

          return '';
        })
        .filter((skill) => skill.length > 0)
    : [];

  const rules: Array<[RegExp, string]> = [
    [/\bpython\b/i, 'Python'],
    [/\bjava\s*script\b|\bjs\b/i, 'JavaScript'],
    [/\breact\b/i, 'React'],
    [/\bhtml5?\b/i, 'HTML5'],
    [/\bcss3?\b/i, 'CSS3'],
    [/\bgit\b/i, 'Git'],
    [/\bscrum\b/i, 'Scrum'],
    [/\bapis?\b|\brest\b/i, 'APIs REST'],
  ];

  const detected: string[] = [];

  // Las habilidades guardadas tienen prioridad.
  // Solo se utiliza la descripción como alternativa si no hay habilidades.
  if (savedSkills.length > 0) {
    detected.push(...savedSkills);
  } else {
    const description = experience.description;

    if (typeof description === 'string' && description.trim()) {
      for (const [pattern, skill] of rules) {
        if (pattern.test(description)) {
          detected.push(skill);
        }
      }
    }
  }

  // Evita duplicados ignorando mayúsculas y minúsculas.
  const uniqueSkills = new Map<string, string>();

  for (const skill of detected) {
    const normalized = skill.trim().toLocaleLowerCase();

    if (normalized && !uniqueSkills.has(normalized)) {
      uniqueSkills.set(normalized, skill.trim());
    }
  }

  return [...uniqueSkills.values()];
}

export function WorkExperienceListCard({
  experiences = [],
  isLoading = false,
  isBusy = false,
  onAdd,
  onEdit,
  onDelete,
}: WorkExperienceListCardProps) {
  if (isLoading) {
    return (
      <section className="px-5 py-4 font-medium text-slate-700">
        Cargando experiencia laboral...
      </section>
    );
  }

  const safeExperiences = [...experiences].sort(
    (a, b) =>
      new Date(b.startDate).getTime() -
      new Date(a.startDate).getTime(),
  );

  return (
    <section className="mx-auto w-full space-y-6 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <BriefcaseBusiness
              aria-hidden="true"
              className="size-5 shrink-0 text-slate-600"
            />
            <span className="wrap-anywhere">Experiencia laboral</span>
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Añade tu trayectoria y proyectos profesionales.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          disabled={isBusy || !onAdd}
          className="shrink-0 gap-2"
        >
          <Plus aria-hidden="true" className="size-4" />
          Añadir experiencia
        </Button>
      </div>

      {safeExperiences.length === 0 ? (
        <section className="text-sm italic text-slate-600">
          Aún no registraste experiencia laboral.
        </section>
      ) : (
        <ul className="relative ml-2 space-y-8 border-l border-slate-300 pl-6">
          {safeExperiences.map((experience, index) => {
            const periodText = formatWorkPeriod(
              experience.startDate,
              experience.endDate,
              experience.isCurrent,
            );

            const skillsList = getSkillNames(
              experience as unknown as ExperienceWithSkills,
            );

            return (
              <li
                key={experience.id ?? index}
                className="group relative min-w-0"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-8 top-1.5 size-3 rounded-full border-2 border-slate-400 bg-white"
                />

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="wrap-anywhere text-base font-semibold text-slate-900">
                      {experience.position}
                    </h4>

                    <p className="wrap-anywhere text-sm font-medium text-slate-700">
                      {experience.companyName}
                    </p>

                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                      {periodText}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(experience)}
                      aria-label={`Editar ${experience.position}`}
                      disabled={isBusy || !onEdit}
                      className="gap-1.5"
                    >
                      Editar
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(experience)}
                      aria-label={`Eliminar ${experience.position}`}
                      disabled={isBusy || !onDelete}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>

                {experience.description && (
                  <p className="mt-3 whitespace-pre-line break-words text-sm text-slate-900">
                    {experience.description}
                  </p>
                )}

                {skillsList.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Habilidades:
                    </span>

                    {skillsList.map((skill) => (
                      <span
                        key={skill.toLocaleLowerCase()}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
