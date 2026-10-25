/* eslint-disable tailwindcss/classnames-order */
'use client';

import { Button } from '@/components/ui/button';
import type { WorkExperienceListCardProps } from '../types/work-experience-list-card-props.types';
import { formatWorkPeriod } from '../utils/format-work-period';

type Skill = string | { name: string };

function getSkillNames(experience: {
  description?: string | null;
  [key: string]: unknown;
}): string[] {
  const rawSkills: unknown = experience.skills;

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

  if (savedSkills.length > 0) {
    return [...new Set(savedSkills)];
  }

  const description = experience.description;

  if (typeof description !== 'string' || !description.trim()) {
    return [];
  }

  const text = description.toLowerCase();
  const detected: string[] = [];

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

  for (const [pattern, skill] of rules) {
    if (pattern.test(text)) {
      detected.push(skill);
    }
  }

  return detected;
}

export function WorkExperienceListCard({
  experiences = [],
  isLoading = false,
  onAdd,
  onEdit,
  onDelete,
}: WorkExperienceListCardProps) {
  if (isLoading) {
    return (
      <section className="font-medium text-slate-700">
        Cargando experiencia laboral...
      </section>
    );
  }

  const safeExperiences = experiences ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="wrap-anywhere text-lg font-semibold text-slate-900">
            Experiencia laboral
          </h3>
          <p className="text-sm text-slate-600">
            Añade tu trayectoria y proyectos profesionales.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="gap-2"
        >
          Añadir experiencia
        </Button>
      </div>

      {safeExperiences.length === 0 ? (
        <section className="text-sm italic text-slate-600">
          Aún no registraste experiencia laboral.
        </section>
      ) : (
        <div className="relative ml-2 space-y-8 border-l border-slate-300 pl-6">
          {safeExperiences.map((experience, index) => {
            const periodText = formatWorkPeriod(
              experience.startDate,
              experience.endDate,
              experience.isCurrent,
            );

            const skillsList = getSkillNames(
              experience as unknown as {
                description?: string | null;
                [key: string]: unknown;
              },
            );

            return (
              <div
                key={experience.id ?? index}
                className="group relative"
              >
                <span className="absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-slate-400 bg-white" />

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="wrap-anywhere text-base font-semibold text-slate-900">
                      {experience.position}
                    </h4>
                    <p className="text-sm font-medium text-slate-700">
                      {experience.companyName}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                      {periodText}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(experience)}
                      aria-label="Editar experiencia"
                      className="gap-1.5"
                    >
                      Editar
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(experience)}
                      aria-label="Eliminar experiencia"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>

                {experience.description && (
                  <p className="mt-3 whitespace-pre-line text-sm text-slate-900">
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
                        key={skill}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}