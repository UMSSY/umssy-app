import { AnswerSurveyView } from "@/modules/surveys";
import type { SurveyDetailPageProps } from "@/modules/surveys";

export default async function SurveyAnswerPage({ params }: SurveyDetailPageProps) {
  const { id } = await params;
  return <AnswerSurveyView id={id} />;
}
