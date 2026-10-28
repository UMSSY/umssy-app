"use client";

import { FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading } from "@/shared/components/layout/page-heading";
import {
  SURVEY_NOTIFICATIONS_DESCRIPTION,
  SURVEY_NOTIFICATIONS_LABEL,
  SURVEY_NOTIFICATIONS_SKELETON_ROWS,
} from "../constants/survey-notifications.constants";
import { SurveyNotificationItem } from "../components/survey-notification-item";
import { SurveyNotificationsEmpty } from "../components/survey-notifications-empty";
import { useSurveyNotifications } from "../hooks/use-survey-notifications";
import { formatPendingSurveysLabel } from "../utils/format-pending-surveys-label";

export function SurveyNotificationsView() {
  const { notifications, pendingCount, isLoading, errorMessage } = useSurveyNotifications();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div aria-busy="true" className="space-y-4 p-6">
          {Array.from({ length: SURVEY_NOTIFICATIONS_SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      );
    }

    if (errorMessage) {
      return (
        <p role="alert" className="px-6 py-8 text-sm text-danger">
          {errorMessage}
        </p>
      );
    }

    if (notifications.length === 0) {
      return <SurveyNotificationsEmpty />;
    }

    return (
      <ul className="divide-y divide-border">
        {notifications.map((notification) => (
          <SurveyNotificationItem key={notification.id} notification={notification} />
        ))}
      </ul>
    );
  };

  return (
    <main className="-mx-8 -my-4 w-auto min-w-0 space-y-6 sm:-mx-6 sm:-my-2 lg:mx-auto lg:my-0 lg:w-full lg:max-w-7xl">
      <PageHeading
        title={SURVEY_NOTIFICATIONS_LABEL}
        description={SURVEY_NOTIFICATIONS_DESCRIPTION}
        className="border-b-0 pb-0"
      />
      <Card role="region" aria-labelledby="survey-list-title" className="gap-0 py-0">
        <CardHeader className="flex flex-wrap items-center gap-3 py-4">
          <FileCheck className="size-6 text-accent" strokeWidth={1.5} aria-hidden="true" />
          <CardTitle id="survey-list-title" className="text-ink">
            Encuestas
          </CardTitle>
          {notifications.length > 0 ? (
            <Badge className="rounded-full bg-interaction font-semibold text-accent">
              {formatPendingSurveysLabel(pendingCount)}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="border-t border-border px-0">{renderContent()}</CardContent>
      </Card>
    </main>
  );
}
