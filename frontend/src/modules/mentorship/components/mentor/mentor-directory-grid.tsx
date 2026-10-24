
import { MentorCard } from "./mentor-card";
import type { MentorDirectoryItem } from "../../types/mentor-directory.types";

type MentorDirectoryGridProps = {
  mentors: MentorDirectoryItem[];
  currentUserId?: string | null;
  returnTo?: string;
};

export function MentorDirectoryGrid({
  mentors,
  currentUserId,
  returnTo = "/mentorship/mentors",
}: MentorDirectoryGridProps) {
  return (
    <section
      aria-label="Listado de mentores"
      className="@container w-full min-w-0"
    >
      <div className="grid grid-cols-1 gap-5 @min-[50rem]:grid-cols-2">
        {mentors.map((mentor) => (
          <MentorCard
            key={mentor.id}
            mentor={mentor}
            isOwnProfile={currentUserId === mentor.id}
            returnTo={returnTo}
          />
        ))}
      </div>
    </section>
  );
}
