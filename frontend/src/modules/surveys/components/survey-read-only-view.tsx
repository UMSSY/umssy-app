import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SURVEY_STATUS_BADGE_CLASSES, SURVEY_STATUS_LABELS, SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { SURVEYS_PATH } from "../constants/survey-routes.constants";
import type { SurveyReadOnlyViewProps } from "../types/survey-component-props.types";
import { formatIsoDisplayDate } from "../utils/survey-dates";
import { toSurveyBuilderState } from "../utils/to-survey-builder-state";
import { PreviewQuestion } from "./preview-question";

export function SurveyReadOnlyView({ survey }: SurveyReadOnlyViewProps) {
  const { questions } = toSurveyBuilderState(survey);
  const details = [
    survey.career?.title,
    survey.academicPeriod,
    survey.opensAt && survey.closesAt
      ? `${formatIsoDisplayDate(survey.opensAt)} - ${formatIsoDisplayDate(survey.closesAt)}`
      : "",
  ].filter(Boolean);

  return (
    <WorkspacePage
      title={survey.title}
      description={details.join(" · ") || undefined}
      actions={
        <Link href={SURVEYS_PATH} className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft aria-hidden="true" />
          {SURVEY_TEXT.backToSurveys}
        </Link>
      }
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={SURVEY_STATUS_BADGE_CLASSES[survey.status]}>{SURVEY_STATUS_LABELS[survey.status]}</Badge>
          <p className="flex items-center gap-2 text-xs text-text-secondary">
            <Info aria-hidden="true" className="size-4 shrink-0" />
            {SURVEY_MESSAGES.readOnlyNotice}
          </p>
        </div>
        {survey.description && (
          <p className="rounded-lg border border-border bg-surface p-5 text-sm whitespace-pre-line text-ink-soft">
            {survey.description}
          </p>
        )}
        {questions.map((question, index) => (
          <PreviewQuestion key={question.id} question={question} index={index} isReadOnly />
        ))}
      </div>
    </WorkspacePage>
  );
}
