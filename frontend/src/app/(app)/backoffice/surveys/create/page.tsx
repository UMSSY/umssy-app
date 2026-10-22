import { CreateSurveyView } from "@/modules/surveys";

export default async function CreateSurveyPage({ searchParams }: { searchParams: Promise<{ resume?: string }> }) {
  const { resume } = await searchParams;
  return <CreateSurveyView resume={resume === "1"} />;
}
