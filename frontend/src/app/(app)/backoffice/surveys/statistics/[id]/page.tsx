import { SurveyAnalyticsView } from "@/modules/surveys";

export default async function SurveyAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SurveyAnalyticsView id={id} />;
}
