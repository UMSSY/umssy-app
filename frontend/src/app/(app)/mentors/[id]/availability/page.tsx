import { MentorPublicAvailabilityView } from "@/modules/availability";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MentorPublicAvailabilityPage({ params }: PageProps) {
  const { id } = await params;
  return <MentorPublicAvailabilityView mentorId={id} />;
}
