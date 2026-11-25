import { MentorFreeBlocksView } from "@/modules/availability";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ areaId?: string | string[]; area?: string | string[]; returnTo?: string | string[] }>;
}

export default async function MentorFreeBlocksPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const context = await searchParams;
  return (
    <MentorFreeBlocksView
      mentorId={id}
      selectedAreaId={typeof context?.areaId === "string" ? context.areaId : undefined}
      area={typeof context?.area === "string" ? context.area : undefined}
      returnTo={typeof context?.returnTo === "string" ? context.returnTo : undefined}
    />
  );
}
