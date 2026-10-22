"use client";

import { FileCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageBreadcrumb } from "@/shared/components/layout/page-breadcrumb";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import {
  SURVEY_NOTIFICATIONS_BREADCRUMB,
  SURVEY_NOTIFICATIONS_DESCRIPTION,
  SURVEY_NOTIFICATIONS_EMPTY_MESSAGE,
  SURVEY_NOTIFICATIONS_LABEL,
} from "../constants/survey-notifications.constants";
import { SurveyNotificationItem } from "../components/survey-notification-item";
import { useSurveyNotifications } from "../hooks/use-survey-notifications";

const SKELETON_ROWS = 3;

export function SurveyNotificationsView() {
  const { notifications, isLoading, errorMessage } = useSurveyNotifications();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div aria-busy="true" className="space-y-4 p-6">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
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
      return <p className="px-6 py-8 text-sm text-text-secondary">{SURVEY_NOTIFICATIONS_EMPTY_MESSAGE}</p>;
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
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <PageBreadcrumb items={SURVEY_NOTIFICATIONS_BREADCRUMB} />
      <WorkspacePage title={SURVEY_NOTIFICATIONS_LABEL} description={SURVEY_NOTIFICATIONS_DESCRIPTION}>
        <section aria-labelledby="survey-list-title" className="rounded-lg border border-border bg-surface">
          <header className="flex items-center gap-3 border-b border-border px-6 py-4">
            <FileCheck className="size-6 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <h2 id="survey-list-title" className="font-tight text-lg font-bold text-ink">
              Encuestas
            </h2>
            <span className="rounded-full bg-interaction px-2 py-0.5 text-xs font-semibold text-accent">
              {notifications.length}
            </span>
          </header>
          {renderContent()}
        </section>
      </WorkspacePage>
    </div>
  );
}
