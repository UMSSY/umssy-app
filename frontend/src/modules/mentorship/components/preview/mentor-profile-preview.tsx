'use client';

import type { MentorProfilePreviewProps } from '../../types/mentor-profile-preview-props.types';

import { Button } from '@/components/ui/button';
import { useMentorProfile } from '../../hooks/use-mentor-profile';
import { MentorProfileHeader } from '../mentor/mentor-profile-header';
import { MentorAbout } from '../mentor/mentor-about';
import { MentorCareer } from '../mentor/mentor-career';
import { MentorTechnicalAreas } from '../mentor/mentor-technical-areas';

export function MentorProfilePreview({
  mentorId,
  technicalAreas,
  orientationTypes,
  onBack,
  backLabel = 'Volver a editar',
}: MentorProfilePreviewProps) {
  const {
    data: mentor,
    isPending,
    isError,
    refetch,
  } = useMentorProfile(mentorId);

  if (isPending) {
    return (
      <main className="mx-auto w-full max-w-7xl p-6">
        <p role="status">Cargando vista previa del perfil...</p>
      </main>
    );
  }

  if (isError || !mentor) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-4 p-6">
        <p role="alert">
          No se pudo cargar la información del perfil del mentor.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => void refetch()}>
            Reintentar
          </Button>

          <Button type="button" variant="outline" onClick={onBack}>
            {backLabel}
          </Button>
        </div>
      </main>
    );
  }

  const professionalInterests = mentor.skills.filter((skill) =>
    skill.name?.trim(),
  );

  return (
    <main className="bg-background">
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-4 py-6 sm:px-6">
        <section
          className="rounded-xl border border-border bg-surface-soft p-4"
          aria-label="Aviso de vista previa"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-surface px-3 py-1 text-xs font-bold tracking-wide text-ink">
              MODO VISTA PREVIA
            </span>
          </div>

          <p className="mt-3 text-sm font-medium text-ink">
            Estás viendo una vista previa de tu perfil.
          </p>

          <p className="mt-1 text-sm text-text-secondary">
            Revisa cómo se mostrarán tus áreas técnicas y tipos de orientación
            antes de confirmar los cambios.
          </p>
        </section>
        <MentorProfileHeader mentor={mentor} showRequestAction={false} />

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
            <MentorAbout
              description={
                mentor.aboutMe?.trim() ||
                'El mentor todavía no ha agregado una descripción personal.'
              }
            />
            <section className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-xl font-bold text-ink">
                Intereses profesionales
              </h2>

              {professionalInterests.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {professionalInterests.map((skill) => (
                    <li
                      key={skill.id}
                      className="rounded-md border border-border bg-surface-soft px-3 py-1 text-sm text-ink"
                    >
                      {skill.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-text-secondary">
                  Sin intereses profesionales registrados.
                </p>
              )}
            </section>
            <section className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-xl font-bold text-ink">
                Tipos de orientación
              </h2>

              {orientationTypes.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {orientationTypes.map((orientation) => (
                    <li
                      key={orientation.id}
                      className="rounded-md border border-border bg-surface-soft px-3 py-2 text-sm text-ink"
                    >
                      <span className="font-medium">{orientation.name}</span>

                      {orientation.description && (
                        <p className="mt-1 text-text-secondary">
                          {orientation.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-text-secondary">
                  No hay tipos de orientación seleccionados.
                </p>
              )}
            </section>
          </div>
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-4">
            <MentorCareer mentor={mentor} />
            <MentorTechnicalAreas areas={technicalAreas} />
          </div>
        </div>
        <section className="rounded-xl border border-border bg-surface-soft p-5">
          <p className="text-sm font-medium text-ink">
            ¿Deseas realizar algún cambio?
          </p>

          <p className="mt-1 text-sm text-text-secondary">
            Regresa al formulario para modificar tus selecciones y confirmar la
            información. Los cambios todavía no se han guardado.
          </p>

          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={onBack}>
              {backLabel}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
