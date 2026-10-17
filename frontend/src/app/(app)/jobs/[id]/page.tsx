import { JobMatchDetailView } from "@/modules/matching";
import type { JobDetailPageProps } from "@/modules/matching";

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  return <JobMatchDetailView jobOfferId={id} />;
}
