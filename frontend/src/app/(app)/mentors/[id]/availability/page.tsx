import { MentorFreeBlocksView } from "@/modules/availability";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ areaId?: string; returnTo?: string }>;
}

export default async function MentorFreeBlocksPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const context = await searchParams;
  return <MentorFreeBlocksView mentorId={id} selectedAreaId={context?.areaId} returnTo={context?.returnTo} />;
}
