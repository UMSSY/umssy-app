import Link from "next/link";
import { ArrowRight, CircleCheck, Clock, FileCheck } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ANSWER_SURVEY_LABEL,
  SURVEY_STATUS_LABELS,
  SURVEY_STATUS_MESSAGES,
  SURVEY_STATUS_TONES,
  SURVEYS_PATH,
} from "../constants/survey-notifications.constants";
import type { SurveyNotificationItemProps } from "../types/survey-notification-item-props.types";
import { formatSurveyDate } from "../utils/format-survey-date";

export function SurveyNotificationItem({ notification }: SurveyNotificationItemProps) {
  const { id, title, publishedAt, status } = notification;
  const tone = SURVEY_STATUS_TONES[status];
  const isPending = status === "pending";

  const renderAction = () => {
    if (isPending) {
      return (
        <Link href={`${SURVEYS_PATH}/${id}`} className={cn(buttonVariants({ variant: "brand" }), "w-full")}>
          {ANSWER_SURVEY_LABEL}
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Link>
      );
    }

    const StatusIcon = status === "expired" ? Clock : CircleCheck;
    return (
      <Button disabled className={cn("w-full disabled:opacity-100", tone)}>
        <StatusIcon aria-hidden="true" />
        {SURVEY_STATUS_LABELS[status]}
      </Button>
    );
  };

  return (
    <li className="flex flex-col gap-4 px-6 py-4 md:min-h-27 md:flex-row md:items-center md:gap-3">
      <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-lg", tone)}>
        <FileCheck className="size-6" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="text-sm text-text-secondary">{SURVEY_STATUS_MESSAGES[status]}</p>
        {isPending ? <Badge className={tone}>{SURVEY_STATUS_LABELS.pending}</Badge> : null}
      </div>
      <time dateTime={publishedAt} className="shrink-0 text-sm text-text-secondary md:w-24 md:text-right">
        {formatSurveyDate(publishedAt)}
      </time>
      <div className="w-full shrink-0 md:w-52">{renderAction()}</div>
    </li>
  );
}
