import { RegisterVacancyView } from "@/modules/job-offers/views/register-vacancy-view";

export default async function EditJobOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RegisterVacancyView jobOfferId={id} />;
}