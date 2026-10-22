import Link from "next/link";
import { ArrowRight, Clock, FileCheck } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import {
  ANSWER_SURVEY_LABEL,
  SURVEY_DETAILS_LABEL,
  SURVEY_STATUS_LABELS,
  SURVEY_STATUS_STYLES,
  SURVEYS_PATH,
} from "../constants/survey-notifications.constants";
import type { SurveyNotificationItemProps } from "../types/survey-notification-item-props.types";
import { formatSurveyDate } from "../utils/format-survey-date";

export function SurveyNotificationItem({ notification }: SurveyNotificationItemProps) {
  const { id, title, description, publishedAt, status } = notification;
  const styles = SURVEY_STATUS_STYLES[status];
  const surveyHref = `${SURVEYS_PATH}/${id}`;

  const renderAction = () => {
    if (status === "pending") {
      return (
        <Link href={surveyHref} className={cn(buttonVariants(), "w-full bg-danger text-surface hover:bg-danger/90")}>
          {ANSWER_SURVEY_LABEL}
          <ArrowRight aria-hidden="true" />
        </Link>
      );
    }

    if (status === "expired") {
      return (
        <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-danger/10 px-4 text-sm font-semibold text-danger">
          <Clock className="size-4" aria-hidden="true" />
          {SURVEY_STATUS_LABELS.expired}
        </span>
      );
    }

    return (
      <Link href={surveyHref} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
        {SURVEY_DETAILS_LABEL}
      </Link>
    );
  };

  return (
    <li className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-start">
      <div className={cn("flex size-14 shrink-0 items-center justify-center rounded-lg", styles.iconBox)}>
        <FileCheck className="size-7" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
        <span className={cn("mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-medium", styles.badge)}>
          {SURVEY_STATUS_LABELS[status]}
        </span>
      </div>
      <time dateTime={publishedAt} className="shrink-0 text-sm text-text-secondary md:w-28 md:text-right">
        {formatSurveyDate(publishedAt)}
      </time>
      <div className="w-full shrink-0 md:w-52">{renderAction()}</div>
    </li>
  );
}
