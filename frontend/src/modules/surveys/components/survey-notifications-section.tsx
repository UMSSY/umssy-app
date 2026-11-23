"use client";

import { ClipboardCheck } from "lucide-react";
import { NotificationsInboxEmpty, NotificationsInboxLoading } from "@/modules/notifications";
import { SurveyNotificationItem } from "./survey-notification-item";
import { useCanAnswerSurveys } from "../hooks/use-can-answer-surveys";
import { useSurveyNotifications } from "../hooks/use-survey-notifications";
import { formatPendingSurveysLabel } from "../utils/format-pending-surveys-label";

function SurveyNotificationsList() {
  const { notifications, pendingCount, isLoading, errorMessage } = useSurveyNotifications();

  const renderContent = () => {
    if (isLoading) {
      return (
        <NotificationsInboxLoading rows={2} />
      );
    }

    if (errorMessage) {
      return (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3.5 text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      );
    }

    if (notifications.length === 0) {
      return (
        <NotificationsInboxEmpty
          icon={ClipboardCheck}
          title="No hay encuestas disponibles"
          description="Cuando tengas una nueva encuesta asignada, aparecerá aquí."
          titleAs="h3"
        />
      );
    }

    return (
      <ul className="flex flex-col gap-2.5">
        {notifications.map((notification) => (
          <SurveyNotificationItem key={notification.id} notification={notification} />
        ))}
      </ul>
    );
  };

  return (
    <section aria-labelledby="survey-list-title" className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <h2 id="survey-list-title" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Encuestas
        </h2>
        {notifications.length > 0 ? (
          <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {formatPendingSurveysLabel(pendingCount)}
          </span>
        ) : null}
      </div>
      {renderContent()}
    </section>
  );
}

export function SurveyNotificationsSection() {
  return useCanAnswerSurveys() ? <SurveyNotificationsList /> : null;
}
