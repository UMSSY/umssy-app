import { AnswerSurveyView } from "@/modules/surveys";

interface SurveyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const { id } = await params;
  return <AnswerSurveyView id={id} />;
}
