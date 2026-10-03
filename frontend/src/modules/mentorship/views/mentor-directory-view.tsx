import { MentorDirectoryGrid } from "../components/mentor-directory-grid";
import { MENTOR_DIRECTORY_FIXTURES } from "../fixtures/mentor-directory.fixtures";

interface MentorDirectoryViewProps {
  isLoading?: boolean;
}

export function MentorDirectoryView({
  isLoading = false,
}: MentorDirectoryViewProps) {
  return (
    <main className="min-h-full bg-surface-soft px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header>
          <h1 className="font-tight text-2xl font-bold text-ink sm:text-3xl">
            Directorio de mentores
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-text-secondary sm:text-base">
            Conoce a los mentores disponibles y sus principales áreas de
            experiencia profesional.
          </p>
        </header>

        <MentorDirectoryGrid
          mentors={MENTOR_DIRECTORY_FIXTURES}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}
