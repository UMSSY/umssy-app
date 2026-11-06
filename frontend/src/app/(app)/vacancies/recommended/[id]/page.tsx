import { JobMatchDetailView } from "@/modules/matching";

export default async function RecommendedVacancyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobMatchDetailView jobOfferId={id} />;
}
