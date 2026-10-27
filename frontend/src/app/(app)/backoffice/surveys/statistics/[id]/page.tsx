import { SurveyAnalyticsView } from "@/modules/surveys";
import type { SurveyStatisticsPageProps } from "@/modules/surveys";

export default async function SurveyStatisticsDetailPage({ params }: SurveyStatisticsPageProps) {
  const { id } = await params;
  return <SurveyAnalyticsView id={id} />;
}
