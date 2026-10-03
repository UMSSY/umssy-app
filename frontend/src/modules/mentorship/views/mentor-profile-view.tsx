"use client";

import { MentorProfileHeader } from "../components/mentor-profile-header";
import { MentorAbout } from "../components/mentor-about";
import { MentorCareer } from "../components/mentor-career";
import { MentorGuidanceTypes } from "../components/mentor-guidance-types";
import { MentorTechnicalAreas } from "../components/mentor-technical-areas";
import { useMentorProfile } from "../hooks/use-mentor-profile";
import { MentorQueryFeedback } from "../components/mentor-query-feedback";
import { MentorQuerySkeleton } from "../components/mentor-query-skeleton";
import { MentorProfileNavigation } from "../components/mentor-profile-navigation";

interface MentorProfileViewProps {
  mentorId: string;
}

export function MentorProfileView({ mentorId }: MentorProfileViewProps) {
  const { data: mentor, isPending, isError, isFetching, refetch } = useMentorProfile(mentorId);

  if (isPending || (isError && isFetching)) {
    return <main className="mx-auto w-full max-w-7xl p-4 sm:p-8"><MentorQuerySkeleton isProfile /></main>;
  }

  if (isError) {
    return <main className="mx-auto w-full max-w-7xl p-4 sm:p-8"><MentorQueryFeedback title="No pudimos cargar el perfil" description="Ocurrió un problema al consultar este perfil. Puedes reintentar o volver al directorio." onRetry={() => { void refetch(); }} showDirectoryLink /></main>;
  }

  if (!mentor) {
    return (
      <main className="min-h-screen bg-surface-soft p-8">
        <MentorQueryFeedback title="Mentor no encontrado" description="No se pudo encontrar el perfil solicitado." showDirectoryLink />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-soft p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <MentorProfileNavigation mentorName={mentor.name} />
        <MentorProfileHeader mentor={mentor} />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-8 lg:col-span-8">
            <MentorAbout description={mentor.description} />

            <MentorGuidanceTypes
              key={mentor.id}
              guidanceTypes={mentor.guidanceTypes}
            />
          </div>

          <div className="flex flex-col gap-8 lg:col-span-4">
            <MentorCareer mentor={mentor} />

            <MentorTechnicalAreas areas={mentor.technicalAreas} />
          </div>
        </div>
      </div>
    </main>
  );
}
