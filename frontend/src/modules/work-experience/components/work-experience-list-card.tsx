/* eslint-disable tailwindcss/classnames-order */
'use client';

import { Button } from '@/components/ui/button';
import type { WorkExperienceListCardProps } from './work-experience-list-card.types';
import { formatWorkPeriod } from '../utils/format-work-period';

export function WorkExperienceListCard({
  experiences = [],
  isLoading = false,
  onAdd,
  onEdit,
  onDelete,
}: WorkExperienceListCardProps) {
  if (isLoading) {
    return <section className="font-medium text-slate-700">Cargando experiencia laboral...</section>;
  }

  const safeExperiences = experiences ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="wrap-anywhere text-lg font-semibold text-slate-900">Experiencia laboral</h3>
          <p className="text-sm text-slate-600">Añade tu trayectoria y proyectos profesionales.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-2">
          <span>+</span> Añadir experiencia
        </Button>
      </div>

      {safeExperiences.length === 0 ? (
        <section className="text-sm italic text-slate-600">Aún no registraste experiencia laboral.</section>
      ) : (
        <div className="relative ml-2 space-y-8 border-l border-slate-300 pl-6">
          {safeExperiences.map((experience, index) => {
            const periodText = formatWorkPeriod(experience.startDate, experience.endDate, experience.isCurrent);

            const rawExperience = experience as Record<string, unknown>;
            let skillsList = (rawExperience.skills as Array<string | { name: string }>) || [];

            if (skillsList.length === 0 && experience.description) {
              const text = experience.description.toLowerCase();
              const detected: string[] = [];
              if (text.includes('python')) detected.push('python');
              if (text.includes('javascript') || text.includes('java script') || text.includes('js')) detected.push('javascript');
              if (text.includes('react')) detected.push('React');
              if (text.includes('html')) detected.push('HTML5');
              if (text.includes('css')) detected.push('CSS3');
              if (text.includes('git')) detected.push('git');
              if (text.includes('scrum')) detected.push('scrum');
              if (text.includes('api') || text.includes('rest')) detected.push('APIs REST');
              skillsList = detected;
            }

            return (
              <div key={experience.id ?? index} className="group relative">
                <span className="absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-slate-400 bg-white" />

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">{experience.position}</h4>
                    <p className="text-sm font-medium text-slate-700">{experience.company}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">{periodText}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(experience)}
                      aria-label="Editar experiencia"
                      className="gap-1.5"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(experience.id)}
                      aria-label="Eliminar experiencia"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>

                {experience.description && (
                  <p className="mt-3 text-sm whitespace-pre-line text-slate-900">{experience.description}</p>
                )}

                {skillsList.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Habilidades:</span>
                    {skillsList.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800"
                      >
                        {typeof skill === 'string' ? skill : skill.name}
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