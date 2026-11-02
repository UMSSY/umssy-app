import { JobOfferApplicantsView } from "@/modules/job-offers";

export default async function JobOfferApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobOfferApplicantsView jobOfferId={id} />;
}
