import { EditSurveyView } from "@/modules/surveys";

export default async function EditSurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ resume?: string }>;
}) {
  const [{ id }, { resume }] = await Promise.all([params, searchParams]);
  return <EditSurveyView id={id} resume={resume === "1"} />;
}
