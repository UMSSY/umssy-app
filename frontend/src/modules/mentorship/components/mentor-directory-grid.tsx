import { MentorCard } from "./mentor-card";
import { MentorCardSkeleton } from "./mentor-card-skeleton";
import type { MentorDirectoryItem } from "../types/mentor-directory.types";

interface MentorDirectoryGridProps {
  mentors: MentorDirectoryItem[];
  isLoading?: boolean;
}

const MENTOR_SKELETON_IDS = Array.from(
  { length: 6 },
  (_, index) => `mentor-skeleton-${index + 1}`,
);

export function MentorDirectoryGrid({
  mentors,
  isLoading = false,
}: MentorDirectoryGridProps) {
  return (
    <section
      aria-label="Listado de mentores"
      aria-busy={isLoading}
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {isLoading ? (
        <>
          <p className="sr-only" role="status">
            Cargando mentores...
          </p>

          {MENTOR_SKELETON_IDS.map((skeletonId) => (
            <MentorCardSkeleton key={skeletonId} />
          ))}
        </>
      ) : (
        mentors.map((mentor) => (
          <MentorCard key={mentor.id} mentor={mentor} />
        ))
      )}
    </section>
  );
}
