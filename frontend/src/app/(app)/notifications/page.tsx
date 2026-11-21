import { Suspense } from "react";
import { NotificationsView } from "@/modules/notifications";
import { SurveyNotificationsSection } from "@/modules/surveys";

export default function NotificationsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationsView filterSections={{ SURVEYS: <SurveyNotificationsSection /> }} />
    </Suspense>
  );
}