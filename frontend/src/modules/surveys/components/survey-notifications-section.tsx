"use client";

import { FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SurveyNotificationItem } from "./survey-notification-item";
import { SurveyNotificationsEmpty } from "./survey-notifications-empty";
import { useCanAnswerSurveys } from "../hooks/use-can-answer-surveys";
import { useSurveyNotifications } from "../hooks/use-survey-notifications";
import { formatPendingSurveysLabel } from "../utils/format-pending-surveys-label";

function SurveyNotificationsList() {
  const { notifications, pendingCount, isLoading, errorMessage } = useSurveyNotifications();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div aria-busy="true" className="space-y-4 p-6">
          {Array.from({ length: 3 }, (_, index) => (
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
  );
}

export function SurveyNotificationsSection() {
  return useCanAnswerSurveys() ? <SurveyNotificationsList /> : null;
}
