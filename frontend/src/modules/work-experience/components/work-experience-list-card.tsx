'use client';

import { ArrowDown, Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/modules/profile';
import { cn } from '@/lib/utils';
import type { WorkExperienceListCardProps } from '../types/work-experience-list-card-props.types';
import type { WorkExperienceItem } from '../types/work-experience-item.types';
import { formatWorkPeriod } from '../utils/format-work-period';
import { groupWorkExperiences } from '../utils/group-work-experiences';

type ExperienceWithSkills = WorkExperienceItem & {
  skills?: unknown;
};

/**
 * Obtiene las habilidades correspondientes a una experiencia.
 * Prioriza las habilidades guardadas y, si no existen,
 * detecta algunas tecnologías mencionadas en la descripción.
 */
function getSkillNames(experience: ExperienceWithSkills): string[] {
  const rawSkills = experience.skills;

  const savedSkills: string[] = Array.isArray(rawSkills)
    ? rawSkills
        .map((skill: unknown) => {
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

  // Eliminar duplicados sin distinguir mayúsculas y minúsculas.
  const uniqueSkills = new Map<string, string>();

  for (const skill of detected) {
    const trimmedSkill = skill.trim();
    const normalized = trimmedSkill.toLocaleLowerCase();

    if (normalized && !uniqueSkills.has(normalized)) {
      uniqueSkills.set(normalized, trimmedSkill);
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
  const groups = groupWorkExperiences(experiences);

  if (isLoading) {
    return (
      <SectionCard title="Experiencia laboral">
        <p className="text-sm text-text-secondary">
          Cargando experiencia laboral...
        </p>
      </SectionCard>
    );
  }

  if (groups.length === 0) {
    return (
      <SectionCard
        title="Experiencia laboral"
        action={
          onAdd ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAdd}
              disabled={isBusy}
            >
              <Plus aria-hidden="true" className="size-4" />
              Añadir experiencia
            </Button>
          ) : null
        }
      >
        <p className="text-sm text-text-secondary">
          Aún no registraste experiencia laboral.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Experiencia laboral"
      action={
        onAdd ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            disabled={isBusy}
          >
            <Plus aria-hidden="true" className="size-4" />
            Añadir experiencia
          </Button>
        ) : null
      }
    >
      <ul className="relative divide-y divide-border">
        {groups.map((group) => (
          <li
            key={group.positions[0].id}
            className="group/timeline relative flex items-start gap-4 py-6 first:pt-0 last:pb-0"
          >
            <span
              aria-hidden="true"
              className="absolute top-12 -bottom-6 left-6 border-l border-border-strong group-last/timeline:hidden"
            />

            <ArrowDown
              aria-hidden="true"
              className="absolute bottom-1 left-4 hidden size-4 text-accent group-last/timeline:block"
            />

            <div
              aria-hidden="true"
              className="relative flex size-12 shrink-0 items-center justify-center rounded-md bg-interaction text-accent"
            >
              <Building2 className="size-6" strokeWidth={1.5} />
            </div>

            <div className="min-w-0 flex-1">
              {group.positions.length > 1 && (
                <h3 className="mb-5 text-lg font-bold wrap-anywhere text-ink">
                  {group.companyName}
                </h3>
              )}

              <ol className="space-y-5">
                {group.positions.map((experience) => {
                  const Heading =
                    group.positions.length > 1 ? 'h4' : 'h3';

                  const skillsList = getSkillNames(
                    experience as ExperienceWithSkills,
                  );

                  return (
                    <li
                      key={experience.id}
                      className={cn(
                        'group/position relative min-w-0',
                        group.positions.length > 1 && 'ml-2 pl-6',
                      )}
                    >
                      {group.positions.length > 1 && (
                        <>
                          <span
                            aria-hidden="true"
                            className="absolute top-2 -bottom-7 left-0 border-l border-border-strong group-last/position:hidden"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute top-2 -left-1 size-2 rounded-full bg-accent"
                          />
                        </>
                      )}

                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <Heading className="text-base font-bold wrap-anywhere text-ink">
                            {experience.position}
                          </Heading>

                          {group.positions.length === 1 && (
                            <p className="mt-1 text-sm wrap-anywhere text-ink-soft">
                              {experience.companyName}
                            </p>
                          )}

                          <p className="mt-1 text-sm text-text-secondary">
                            {formatWorkPeriod(
                              experience.startDate,
                              experience.endDate,
                              experience.isCurrent,
                            )}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label={`Editar ${experience.position}`}
                            className="size-9 p-0 text-ink-soft"
                            disabled={isBusy || !onEdit}
                            onClick={() => onEdit?.(experience)}
                          >
                            <Pencil
                              className="size-4"
                              aria-hidden="true"
                            />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            aria-label={`Eliminar ${experience.position}`}
                            className="size-9 p-0 text-danger hover:bg-brand-red/10 hover:text-danger"
                            disabled={isBusy || !onDelete}
                            onClick={() => onDelete?.(experience)}
                          >
                            <Trash2
                              className="size-4"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      </div>

                      {experience.description && (
                        <p className="mt-3 max-w-prose text-sm leading-relaxed wrap-anywhere whitespace-pre-line text-ink-soft">
                          {experience.description}
                        </p>
                      )}

                      {skillsList.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-ink-soft">
                            Habilidades:
                          </span>

                          {skillsList.map((skill) => (
                            <span
                              key={skill.toLocaleLowerCase()}
                              className="inline-flex items-center rounded-full border border-border bg-interaction px-2.5 py-0.5 text-xs font-medium text-ink"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}