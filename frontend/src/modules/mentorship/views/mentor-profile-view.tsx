'use client';
import type { MentorProfileViewProps } from '../types/mentor-profile-view-props.types';
import { RADAR_AXIS_NAMES } from '@/modules/radar-chart/constants/radar-axis-names.constants';
import { resolveRadarMentorAreas } from '../utils/radar-mentor-area';

import { MentorProfileHeader } from '../components/mentor/mentor-profile-header';
import { MentorAbout } from '../components/mentor/mentor-about';
import { MentorCareer } from '../components/mentor/mentor-career';
import { MentorGuidanceTypes } from '../components/mentor/mentor-guidance-types';
import { MentorTechnicalAreas } from '../components/mentor/mentor-technical-areas';
import { useMentorProfile } from '../hooks/use-mentor-profile';
import { MentorQueryFeedback } from '../components/mentor/mentor-query-feedback';
import { MentorQuerySkeleton } from '../components/mentor/mentor-query-skeleton';
import { MentorProfileNavigation } from '../components/mentor/mentor-profile-navigation';
import { useCurrentUserId } from '../hooks/use-current-user-id';
import { SimilarMentorsSection } from '../components/mentor/similar-mentors-section';
import { useSimilarMentors } from '../hooks/use-similar-mentors';
import type { SimilarMentorsSectionProps } from '../types/similar-mentor.types';

export function MentorProfileView({
  mentorId,
  returnTo = '/mentorship/mentors',
}: MentorProfileViewProps) {
  const { currentUserId, canVerifyIdentity } = useCurrentUserId();

  const {
    data: mentor,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useMentorProfile(mentorId);

  const similar = useSimilarMentors(
    mentorId,
    !isError && Boolean(mentor?.fullName?.trim()),
  );

  if (isPending || (isError && isFetching)) {
    return (
      <main className="mx-auto w-full max-w-7xl">
        <MentorQuerySkeleton isProfile />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto w-full max-w-7xl">
        <MentorQueryFeedback
          title="No pudimos cargar el perfil"
          description="Ocurrió un problema al consultar este perfil. Puedes reintentar o volver al directorio."
          onRetry={() => {
            void refetch();
          }}
          showDirectoryLink
          directoryHref={returnTo}
        />
      </main>
    );
  }

  if (!mentor) {
    return (
      <main className="mx-auto w-full max-w-7xl">
        <MentorQueryFeedback
          title="Mentor no encontrado"
          description="No se pudo encontrar el perfil solicitado."
          showDirectoryLink
          directoryHref={returnTo}
        />
      </main>
    );
  }

  if (!mentor.fullName?.trim()) {
    return (
      <main className="mx-auto w-full max-w-7xl">
        <MentorQueryFeedback
          title="Perfil incompleto"
          description="Falta el nombre del mentor. El perfil completo todavía no está disponible."
          showDirectoryLink
          directoryHref={returnTo}
        />
      </main>
    );
  }
  const professionalInterests = mentor.skills.filter((skill) => skill.name?.trim());
  const directoryParams = new URL(returnTo, "http://localhost").searchParams;
  const areaId = directoryParams.get("areaId");
  const radarAxis = RADAR_AXIS_NAMES.find(axis => axis.id === directoryParams.get('radarArea'));
  const selectedArea = mentor.technicalAreas.find(area =>
    areaId ? area.id === areaId : area.name === directoryParams.get("area"),
  ) ?? (radarAxis ? resolveRadarMentorAreas(radarAxis.id, mentor.technicalAreas)[0] : undefined);
  const similarProps: SimilarMentorsSectionProps =
    similar.isPending || (similar.isError && similar.isFetching)
      ? { status: 'loading' }
      : similar.isError
        ? {
            status: 'error',
            onRetry: () => {
              void similar.refetch();
            },
          }
        : { status: 'success', mentors: similar.data };

  return (
    <main className="bg-background lg:-mt-3">
      <div className="mx-auto w-full max-w-[1344px] min-w-0 space-y-[18px]">
        <MentorProfileNavigation
          mentorName={mentor.fullName}
          returnTo={returnTo}
        />

        {!mentor.workExperiences.some(
          (experience) => experience.isCurrent && experience.position?.trim(),
        ) && (
          <p
            role="status"
            className="mt-4 rounded-lg border border-border bg-surface-soft p-4 text-sm text-text-secondary"
          >
            Perfil profesional incompleto: cargo actual no registrado.
          </p>
        )}

        <MentorProfileHeader
          mentor={mentor}
          selectedArea={selectedArea?.name}
          selectedAreaId={areaId || radarAxis ? selectedArea?.id : undefined}
          returnTo={returnTo}
          showRequestAction={canVerifyIdentity && currentUserId !== mentor.id}
        />

        <div className="grid min-w-0 gap-[18px] lg:grid-cols-[minmax(0,2.25fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col border border-border bg-surface [&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:shadow-none">
            {mentor.aboutMe && <MentorAbout description={mentor.aboutMe} />}

            <section className="order-last border-t border-border px-7 py-4">
              <h2 className="font-serif text-lg font-semibold text-accent">
                Intereses profesionales
              </h2>
              {professionalInterests.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {professionalInterests.map((skill) => (
                    <li
                      key={skill.id}
                      className="max-w-full min-w-0 rounded-md border border-border bg-surface-soft px-3 py-1 text-sm [overflow-wrap:anywhere] text-ink"
                    >
                      {skill.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-text-secondary">
                  Sin intereses profesionales registrados
                </p>
              )}
            </section>

            <MentorGuidanceTypes
              key={mentor.id}
              orientationTypes={mentor.orientationTypes}
            />
          </div>

          <aside aria-label="Trayectoria y especialidades" className="flex min-w-0 flex-col divide-y divide-border border border-border bg-surface [&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:shadow-none">
            <MentorCareer mentor={mentor} />

            <MentorTechnicalAreas areas={mentor.technicalAreas} />
          </aside>
        </div>
        <SimilarMentorsSection {...similarProps} returnTo={returnTo} />
      </div>
    </main>
  );
}
