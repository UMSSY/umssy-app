import { redirect } from "next/navigation";
import { SURVEY_NOTIFICATIONS_PATH } from "@/modules/surveys";

export default function SurveysPage() {
  redirect(SURVEY_NOTIFICATIONS_PATH);
}
