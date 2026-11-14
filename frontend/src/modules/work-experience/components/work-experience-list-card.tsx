'use client';

import { useState } from 'react';
import { Building2, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/modules/profile';
import { cn } from '@/lib/utils';
import type { WorkExperienceCompanyGroup } from '../types/work-experience-company-group.types';
import type { WorkExperienceListCardProps } from '../types/work-experience-list-card-props.types';
import { formatWorkPeriod } from '../utils/format-work-period';
import { getCompanyGroupPeriod } from '../utils/get-company-group-period';
import { groupWorkExperiences } from '../utils/group-work-experiences';

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
            const groupId = group.id;
            const positionsId = `${groupId}-positions`;
            const isCollapsible = group.positions.length > 1;
            const isCollapsed = isCollapsible && (collapsedGroups[groupId] ?? false);
            const headerClassName =
              'flex w-full items-center gap-3 rounded-lg bg-interaction p-3 text-left';
            const headerContent = (
              <>
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-md bg-background text-accent"
                >
                  <Building2 className="size-6" strokeWidth={1.5} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block wrap-anywhere text-ink">
                    {group.companyName}
                  </span>

                  <span className="mt-1 block text-sm font-normal text-text-secondary">
                    {group.positions.length}{' '}
                    {group.positions.length === 1 ? 'cargo' : 'cargos'}
                    {isCollapsible && (
                      <>
                        {' · '}
                        {getCompanyGroupPeriod(group.positions)}
                      </>
                    )}
                  </span>
                </span>
              </>
            );

            return (
              <li key={groupId} className="py-5 first:pt-0 last:pb-0">
                <h3 className="text-base font-bold">
                  {isCollapsible ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        headerClassName,
                        'transition-colors hover:bg-interaction/80',
                      )}
                      aria-expanded={!isCollapsed}
                      aria-controls={positionsId}
                      onClick={() => toggleGroup(groupId)}
                    >
                      {headerContent}

                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          'size-5 shrink-0 text-text-secondary transition-transform',
                          !isCollapsed && 'rotate-180',
                        )}
                      />
                    </Button>
                  ) : (
                    <span className={headerClassName}>{headerContent}</span>
                  )}
                </h3>

                <ol
                  id={positionsId}
                  hidden={isCollapsed}
                  className="mt-5 ml-5 space-y-6 border-l border-border-strong"
                >
                  {group.positions.map((experience) => {
                    const skillsList =
                      skillsByExperience[experience.id] ?? [];

                    return (
                      <li
                        key={experience.id}
                        className="relative min-w-0 pl-5"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute top-2 left-0 size-2.5 -translate-x-1/2 rounded-full border-2 border-background bg-accent"
                        />

                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-bold wrap-anywhere text-ink">
                              {experience.position}
                            </h4>

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
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
