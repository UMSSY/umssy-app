import { RegisterVacancyView } from "@/modules/job-offers";

interface EditJobOfferPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobOfferPage({ params }: EditJobOfferPageProps) {
  const { id } = await params;
  
  return <RegisterVacancyView jobOfferId={id} />;
}