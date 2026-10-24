
import { MentorProfileView } from "@/modules/mentorship";

interface MentorProfilePageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
}

export default async function MentorProfilePage({
  params,
  searchParams,
}: MentorProfilePageProps) {
  const { id } = await params;
  const { returnTo } = await searchParams;

  const safeReturnTo =
    typeof returnTo === "string" &&
    returnTo.startsWith("/mentorship/mentors?") &&
    !returnTo.startsWith("//") &&
    !returnTo.includes("\\")
      ? returnTo
      : "/mentorship/mentors";

  return (
    <MentorProfileView
      mentorId={id}
      returnTo={safeReturnTo}
    />
  );
}
