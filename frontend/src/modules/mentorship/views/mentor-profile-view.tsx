
"use client";

import { MentorProfileHeader } from "../components/mentor/mentor-profile-header";
import { MentorAbout } from "../components/mentor/mentor-about";
import { MentorCareer } from "../components/mentor/mentor-career";
import { MentorGuidanceTypes } from "../components/mentor/mentor-guidance-types";
import { MentorTechnicalAreas } from "../components/mentor/mentor-technical-areas";
import { useMentorProfile } from "../hooks/use-mentor-profile";
import { MentorQueryFeedback } from "../components/mentor/mentor-query-feedback";
import { MentorQuerySkeleton } from "../components/mentor/mentor-query-skeleton";
import { MentorProfileNavigation } from "../components/mentor/mentor-profile-navigation";
import { useCurrentUserId } from "../hooks/use-current-user-id";

type MentorProfileViewProps = {
  mentorId: string;
  returnTo?: string;
};

export function MentorProfileView({
  mentorId,
  returnTo = "/mentorship/mentors",
}: MentorProfileViewProps) {
  const { currentUserId, canVerifyIdentity } = useCurrentUserId();

  const {
    data: mentor,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useMentorProfile(mentorId);

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
        />
      </main>
    );
  }

  if (!mentor.fullName?.trim()) {
    return <main className="mx-auto w-full max-w-7xl"><MentorQueryFeedback title="Perfil incompleto" description="Falta el nombre del mentor. El perfil completo todavía no está disponible." showDirectoryLink /></main>;
  }
  const professionalInterests = mentor.skills.filter((skill) => skill.name?.trim());

  return (
    <main className="bg-background">
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <MentorProfileNavigation
          mentorName={mentor.fullName}
          returnTo={returnTo}
        />

        {!mentor.workExperiences.some((experience) => experience.isCurrent && experience.position?.trim()) && (
          <p role="status" className="mt-4 rounded-lg border border-border bg-surface-soft p-4 text-sm text-text-secondary">Perfil profesional incompleto: cargo actual no registrado.</p>
        )}

        <MentorProfileHeader
          mentor={mentor}
          showRequestAction={
            canVerifyIdentity && currentUserId !== mentor.id
          }
        />

        <div className="mt-6 grid min-w-0 grid-cols-12 gap-6">
          <div className="col-span-8 flex min-w-0 flex-col gap-6">
            {mentor.aboutMe && (
              <MentorAbout description={mentor.aboutMe} />
            )}

            <section className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-xl font-bold text-ink">Intereses profesionales</h2>
              {professionalInterests.length ? <ul className="mt-3 flex flex-wrap gap-2">{professionalInterests.map((skill) => <li key={skill.id} className="rounded-md border border-border bg-surface-soft px-3 py-1 text-sm text-ink">{skill.name}</li>)}</ul> : <p className="mt-3 text-sm text-text-secondary">Sin intereses profesionales registrados</p>}
            </section>

            <MentorGuidanceTypes
              key={mentor.id}
              orientationTypes={mentor.orientationTypes}
            />
          </div>

          <div className="col-span-4 flex min-w-0 flex-col gap-6">
            <MentorCareer mentor={mentor} />

            <MentorTechnicalAreas areas={mentor.technicalAreas} />
          </div>
        </div>
      </div>
    </main>
  );
}
