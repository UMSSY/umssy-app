import { SurveyResponseView } from "@/modules/surveys";

interface SurveyResponsePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SurveyResponsePage({ params }: SurveyResponsePageProps) {
  const { id } = await params;

  return <SurveyResponseView surveyId={id} />;
}
