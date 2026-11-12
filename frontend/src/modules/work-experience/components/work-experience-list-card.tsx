'use client';
import { useState } from 'react';
import { Building2, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/modules/profile';
import { cn } from '@/lib/utils';
import type { WorkExperienceItem } from '../types/work-experience-item.types';
import type { WorkExperienceCompanyGroup } from '../types/work-experience-company-group.types';
import type { WorkExperienceListCardProps } from '../types/work-experience-list-card-props.types';
import { formatWorkPeriod } from '../utils/format-work-period';
import { groupWorkExperiences } from '../utils/group-work-experiences';

function getCompanyGroupPeriod(positions: WorkExperienceItem[]): string {
  const oldestPosition = positions.reduce((oldest, current) =>
    current.startDate < oldest.startDate ? current : oldest,
  );

  const hasCurrentPosition = positions.some(
    (position) => position.isCurrent || !position.endDate,
  );

  const latestEndDate = hasCurrentPosition
    ? null
    : positions.reduce((latest, current) =>
        (current.endDate ?? '') > (latest.endDate ?? '') ? current : latest,
      ).endDate;

  return formatWorkPeriod(
    oldestPosition.startDate,
    latestEndDate,
    hasCurrentPosition,
  );
}

export function WorkExperienceListCard({
  experiences = [],
  isLoading = false,
  isBusy = false,
  onAdd,
  onEdit,
  onDelete,
  skillsByExperience = {},
}: WorkExperienceListCardProps) {
  const groups = groupWorkExperiences(experiences);

  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((previous) => ({
      ...previous,
      [groupId]: !previous[groupId],
    }));
  };

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
      {isLoading ? (
        <p className="text-sm text-text-secondary">
          Cargando experiencia laboral...
        </p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Aún no registraste experiencia laboral.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {groups.map((group: WorkExperienceCompanyGroup) => {
            const groupId = `company-${group.positions[0].id}`;
            const isCollapsed = collapsedGroups[groupId] ?? false;

            return (
              <li key={groupId} className="py-5 first:pt-0 last:pb-0">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex w-full items-center gap-3 rounded-lg bg-interaction p-3 text-left transition-colors hover:bg-interaction/80"
                  aria-expanded={!isCollapsed}
                  aria-controls={`${groupId}-positions`}
                  onClick={() => toggleGroup(groupId)}
                >
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-md bg-background text-accent"
                  >
                    <Building2 className="size-6" strokeWidth={1.5} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-bold wrap-anywhere text-ink">
                      {group.companyName}
                    </span>

                    <span className="mt-1 block text-sm text-text-secondary">
                      {group.positions.length}{' '}
                      {group.positions.length === 1 ? 'cargo' : 'cargos'}
                      {' · '}
                      {getCompanyGroupPeriod(group.positions)}
                    </span>
                  </span>

                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'size-5 shrink-0 text-text-secondary transition-transform',
                      !isCollapsed && 'rotate-180',
                    )}
                  />
                </Button>

                {!isCollapsed && (
                  <ol
                    id={`${groupId}-positions`}
                    className="mt-5 ml-5 space-y-6 border-l border-border-strong pl-5"
                  >
                    {group.positions.map((experience) => {
                      const Heading = group.positions.length > 1 ? 'h4' : 'h3';

                      const skillsList =
                        skillsByExperience[experience.id] ?? [];

                      return (
                        <li key={experience.id} className="relative min-w-0">
                          <span
                            aria-hidden="true"
                            className="absolute top-2 -left-[25px] size-2.5 rounded-full border-2 border-background bg-accent"
                          />

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <Heading className="text-base font-bold wrap-anywhere text-ink">
                                {experience.position}
                              </Heading>

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
                                <Pencil className="size-4" aria-hidden="true" />
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                aria-label={`Eliminar ${experience.position}`}
                                className="size-9 p-0 text-danger hover:bg-brand-red/10 hover:text-danger"
                                disabled={isBusy || !onDelete}
                                onClick={() => onDelete?.(experience)}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
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
                                  key={skill.toLowerCase()}
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
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
