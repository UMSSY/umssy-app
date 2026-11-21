import Link from "next/link";
import { CircleCheck, Clock, FileCheck } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { SURVEY_STATUS_LABELS, SURVEY_STATUS_MESSAGES, SURVEY_STATUS_TONES, SURVEY_ANSWER_PATH } from "../constants/survey-notifications.constants";
import type { SurveyNotificationItemProps } from "../types/survey-notification-item-props.types";
import { formatSurveyDate } from "../utils/format-survey-date";

export function SurveyNotificationItem({ notification }: SurveyNotificationItemProps) {
  const { id, title, publishedAt, status } = notification;
  const tone = SURVEY_STATUS_TONES[status];
  const isPending = status === "pending";
  const StatusIcon = status === "expired" ? Clock : CircleCheck;

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between",
        isPending ? "border-border bg-card shadow-xs" : "border-border/80 bg-muted/40",
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span
          aria-hidden="true"
          className={cn("mt-2 size-2 shrink-0 rounded-full sm:mt-0", isPending ? "bg-brand-red" : "bg-transparent")}
        />
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border border-border", tone)}>
          <FileCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{SURVEY_STATUS_MESSAGES[status]}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 pl-5 sm:pl-0">
        <time dateTime={publishedAt} className="text-xs whitespace-nowrap text-muted-foreground">
          {formatSurveyDate(publishedAt)}
        </time>
        {isPending ? (
          <Link href={`${SURVEY_ANSWER_PATH}/${id}`} className={buttonVariants({ variant: "default", size: "sm" })}>
            {"Responder encuesta"}
          </Link>
        ) : (
          <Button type="button" size="sm" variant="outline" disabled className="gap-1.5 disabled:opacity-100">
            <StatusIcon className="size-3.5" aria-hidden="true" />
            {SURVEY_STATUS_LABELS[status]}
          </Button>
        )}
      </div>
    </li>
  );
}
