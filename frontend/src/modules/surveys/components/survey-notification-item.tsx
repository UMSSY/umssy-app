import Link from "next/link";
import { ArrowRight, CircleCheck, Clock, FileCheck, FileClock } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { SURVEY_STATUS_LABELS, SURVEY_STATUS_MESSAGES, SURVEY_STATUS_TONES, SURVEY_ANSWER_PATH } from "../constants/survey-notifications.constants";
import type { SurveyNotificationItemProps } from "../types/survey-notification-item-props.types";
import { formatSurveyDate } from "../utils/format-survey-date";

export function SurveyNotificationItem({ notification }: SurveyNotificationItemProps) {
  const { id, title, publishedAt, status } = notification;
  const tone = SURVEY_STATUS_TONES[status];
  const isPending = status === "pending";

  const renderAction = () => {
    if (isPending) {
      return (
        <Link href={`${SURVEY_ANSWER_PATH}/${id}`} className={cn(buttonVariants({ variant: "default" }), "w-full")}>
          <FileClock data-icon="inline-start" aria-hidden="true" />
          {"Responder encuesta"}
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
    <li className="flex min-w-0 flex-col gap-4 p-4 sm:px-6 @3xl:min-h-27 @3xl:flex-row @3xl:items-center @3xl:gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-3 @3xl:items-center">
        <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-lg", tone)}>
          <FileCheck className="size-6" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-lg font-semibold break-words text-ink">{title}</h3>
          <p className="text-sm break-words text-text-secondary">{SURVEY_STATUS_MESSAGES[status]}</p>
          {isPending ? <Badge className={tone}>{SURVEY_STATUS_LABELS.pending}</Badge> : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:gap-4">
        <time dateTime={publishedAt} className="text-sm whitespace-nowrap text-text-secondary @3xl:w-24 @3xl:text-right">
          {formatSurveyDate(publishedAt)}
        </time>
        <div className="w-full whitespace-nowrap @3xl:w-52">{renderAction()}</div>
      </div>
    </li>
  );
}
