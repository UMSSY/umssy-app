import { redirect } from "next/navigation";
import { SURVEYS_PATH } from "@/modules/surveys";

export default function SurveyStatisticsPage() {
  redirect(SURVEYS_PATH);
}
