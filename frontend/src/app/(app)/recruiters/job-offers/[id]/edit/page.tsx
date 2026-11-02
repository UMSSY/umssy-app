import { RegisterVacancyView } from "@/modules/job-offers";

export default async function EditJobOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RegisterVacancyView jobOfferId={id} />;
}
