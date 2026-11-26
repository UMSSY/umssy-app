import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getNotificationInboxFilterFromSlug,
  NotificationsView,
} from "@/modules/notifications";
import { SurveyNotificationsSection } from "@/modules/surveys";

interface NotificationsFilterPageProps {
  params: Promise<{
    filter: string;
  }>;
}

export default async function NotificationsFilterPage({
  params,
}: NotificationsFilterPageProps) {
  const { filter } = await params;
  const inboxFilter = getNotificationInboxFilterFromSlug(filter);
  if (!inboxFilter) notFound();

  return (
    <Suspense fallback={null}>
      <NotificationsView
        filter={inboxFilter}
        filterSections={{ SURVEYS: <SurveyNotificationsSection /> }}
      />
    </Suspense>
  );
}