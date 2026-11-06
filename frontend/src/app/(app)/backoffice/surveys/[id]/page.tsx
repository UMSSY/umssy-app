import { SurveyDetailView } from "@/modules/surveys";
import type { SurveyDetailPageProps } from "@/modules/surveys";

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const { id } = await params;
  return <SurveyDetailView id={id} />;
}
