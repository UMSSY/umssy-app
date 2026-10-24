import Link from "next/link";
import { BarChart3, Eye, Pencil } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SURVEY_ROW_ACTION_LABELS, getSurveyDetailPath, getSurveyStatisticsPath } from "../constants/survey-routes.constants";
import type { SurveyRowActionsProps } from "../types/survey-component-props.types";

const ACTION_CLASSES = cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "bg-surface");

export function SurveyRowActions({ survey }: SurveyRowActionsProps) {
  const isDraft = survey.status === "draft";
  const OpenIcon = isDraft ? Pencil : Eye;
  const openLabel = isDraft ? SURVEY_ROW_ACTION_LABELS.edit(survey.title) : SURVEY_ROW_ACTION_LABELS.view(survey.title);

  return (
    <div className="flex items-center gap-2">
      <Link href={getSurveyDetailPath(survey.id)} aria-label={openLabel} title={openLabel} className={ACTION_CLASSES}>
        <OpenIcon aria-hidden="true" />
      </Link>
      <Separator orientation="vertical" className="h-6" />
      {isDraft ? (
        <span
          role="link"
          aria-disabled="true"
          aria-label={SURVEY_ROW_ACTION_LABELS.statisticsUnavailable}
          title={SURVEY_ROW_ACTION_LABELS.statisticsUnavailable}
          className={cn(ACTION_CLASSES, "cursor-not-allowed opacity-40 hover:bg-surface")}
        >
          <BarChart3 aria-hidden="true" />
        </span>
      ) : (
        <Link
          href={getSurveyStatisticsPath(survey.id)}
          aria-label={SURVEY_ROW_ACTION_LABELS.statistics(survey.title)}
          title={SURVEY_ROW_ACTION_LABELS.statistics(survey.title)}
          className={ACTION_CLASSES}
        >
          <BarChart3 aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
