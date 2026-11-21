import Link from "next/link";
import { CircleCheck, Clock, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { NotificationCard } from "@/modules/notifications";
import { SURVEY_STATUS_LABELS, SURVEY_STATUS_MESSAGES, SURVEY_STATUS_TONES, SURVEY_ANSWER_PATH } from "../constants/survey-notifications.constants";
import type { SurveyNotificationItemProps } from "../types/survey-notification-item-props.types";
import { formatSurveyDate } from "../utils/format-survey-date";

export function SurveyNotificationItem({ notification }: SurveyNotificationItemProps) {
  const { id, title, publishedAt, status } = notification;
  const isPending = status === "pending";
  const StatusIcon = status === "expired" ? Clock : CircleCheck;

  return (
    <li>
      <NotificationCard
        icon={FileCheck}
        iconClassName={`border-border ${SURVEY_STATUS_TONES[status]}`}
        title={title}
        description={SURVEY_STATUS_MESSAGES[status]}
        isHighlighted={isPending}
        dateTime={publishedAt}
        timeLabel={formatSurveyDate(publishedAt)}
        action={
          isPending ? (
            <Link href={`${SURVEY_ANSWER_PATH}/${id}`} className={buttonVariants({ variant: "default", size: "sm" })}>
              {"Responder encuesta"}
            </Link>
          ) : (
            <Button type="button" size="sm" variant="outline" disabled className="gap-1.5 disabled:opacity-100">
              <StatusIcon className="size-3.5" aria-hidden="true" />
              {SURVEY_STATUS_LABELS[status]}
            </Button>
          )
        }
      />
    </li>
  );
}
