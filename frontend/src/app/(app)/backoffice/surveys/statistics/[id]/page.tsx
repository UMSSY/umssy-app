import { SurveyAnalyticsView } from "@/modules/surveys";

interface SurveyStatisticsDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyStatisticsDetailPage({ params }: SurveyStatisticsDetailPageProps) {
  const { id } = await params;
  return <SurveyAnalyticsView id={id} />;
}
