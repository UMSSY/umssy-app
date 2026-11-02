"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { SurveyQuestionField } from "../components/survey-question-field";
import {
  SURVEY_ANSWER_HINTS,
  SURVEY_ANSWER_REDIRECT_DELAY_MS,
  SURVEY_ANSWER_TEXT,
} from "../constants/survey-answer.constants";
import { SURVEY_NOTIFICATIONS_PATH } from "../constants/survey-notifications.constants";
import { useSurveyDetail } from "../hooks/use-survey-detail";
import { surveysService } from "../services/surveys.service";
import type { AnswerSurveyViewProps } from "../types/survey-component-props.types";
import { formatSurveyDate } from "../utils/format-survey-date";

const QUESTION_ID_PREFIX = "question";

export function AnswerSurveyView({ id }: AnswerSurveyViewProps) {
  const router = useRouter();
  const { survey, isLoading, errorMessage } = useSurveyDetail(id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const handleAnswerChange = (questionId: string, optionIds: string[]) => {
    setSelectedAnswers((previous) => ({ ...previous, [questionId]: optionIds }));
    setValidationErrors((previous) => {
      if (!previous[questionId]) return previous;
      const next = { ...previous };
      delete next[questionId];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!survey || isSubmitting) return;

    const errors: Record<string, string> = {};
    for (const question of survey.questions ?? []) {
      if (question.isRequired && (selectedAnswers[question.id] ?? []).length === 0) {
        errors[question.id] = SURVEY_ANSWER_TEXT.requiredQuestion;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const [firstInvalidId] = Object.keys(errors);
      document.getElementById(`${QUESTION_ID_PREFIX}-${firstInvalidId}-card`)?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      setIsSubmitting(true);
      const answers = Object.entries(selectedAnswers)
        .filter(([, optionIds]) => optionIds.length > 0)
        .map(([questionId, optionIds]) => ({ questionId, optionIds }));

      await surveysService.submitAnswers(id, { answers });
      setIsSubmittedSuccess(true);
      toast.success(SURVEY_ANSWER_TEXT.submitSuccess);
      setTimeout(() => router.push(SURVEY_NOTIFICATIONS_PATH), SURVEY_ANSWER_REDIRECT_DELAY_MS);
    } catch (error: unknown) {
      toast.error(getApiErrorDetail(error) ?? (error instanceof Error ? error.message : SURVEY_ANSWER_TEXT.submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-6 w-36" />
        <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </main>
    );
  }

  if (errorMessage || !survey) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-xl border border-border bg-surface p-8 shadow-xs">
          <h2 className="text-xl font-bold text-ink">{SURVEY_ANSWER_TEXT.loadErrorTitle}</h2>
          <p className="mt-2 text-sm text-text-secondary">{errorMessage ?? SURVEY_ANSWER_TEXT.loadErrorDescription}</p>
          <div className="mt-6">
            <Link href={SURVEY_NOTIFICATIONS_PATH} className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
              {SURVEY_ANSWER_TEXT.backToSurveys}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (survey.hasAnswered || isSubmittedSuccess) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="space-y-4 rounded-xl border border-border bg-surface p-8 shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-availability text-availability-foreground">
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-ink">{SURVEY_ANSWER_TEXT.completedTitle}</h2>
          <p className="text-sm text-text-secondary">{SURVEY_ANSWER_TEXT.completedDescription(survey.title)}</p>
          <div className="pt-4">
            <Link href={SURVEY_NOTIFICATIONS_PATH} className={buttonVariants({ variant: "brand" })}>
              {SURVEY_ANSWER_TEXT.backToNotifications}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (survey.isExpired) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="space-y-4 rounded-xl border border-border bg-surface p-8 shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-notice text-notice-foreground">
            <Clock className="size-8" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-ink">{SURVEY_ANSWER_TEXT.expiredTitle}</h2>
          <p className="text-sm text-text-secondary">{SURVEY_ANSWER_TEXT.expiredDescription(survey.title)}</p>
          <div className="pt-4">
            <Link href={SURVEY_NOTIFICATIONS_PATH} className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
              {SURVEY_ANSWER_TEXT.backToSurveyList}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <Link
          href={SURVEY_NOTIFICATIONS_PATH}
          className="inline-flex items-center text-sm font-medium text-text-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft className="mr-1.5 size-4" aria-hidden="true" />
          {SURVEY_ANSWER_TEXT.backToSurveys}
        </Link>
      </div>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            {SURVEY_ANSWER_TEXT.audienceBadge}
          </Badge>
          {survey.academicPeriod ? <Badge variant="secondary">{survey.academicPeriod}</Badge> : null}
          {survey.closesAt ? (
            <span className="text-xs text-text-secondary">
              {SURVEY_ANSWER_TEXT.closesAtPrefix} {formatSurveyDate(survey.closesAt)}
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{survey.title}</h1>
        {survey.description ? <p className="mt-3 text-base text-text-secondary">{survey.description}</p> : null}
        <p className="mt-4 text-xs text-text-secondary">{SURVEY_ANSWER_TEXT.requiredNotice}</p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        {(survey.questions ?? []).map((question, index) => (
          <SurveyQuestionField
            key={question.id}
            idPrefix={QUESTION_ID_PREFIX}
            question={question}
            index={index}
            hint={SURVEY_ANSWER_HINTS[question.type]}
            selectedOptionIds={selectedAnswers[question.id] ?? []}
            onChange={(optionIds) => handleAnswerChange(question.id, optionIds)}
            error={validationErrors[question.id]}
          />
        ))}

        <div className="flex flex-col-reverse gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <Link href={SURVEY_NOTIFICATIONS_PATH} className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
            {SURVEY_ANSWER_TEXT.cancel}
          </Link>
          <Button type="submit" variant="brand" disabled={isSubmitting} className="w-full min-w-36 sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                {SURVEY_ANSWER_TEXT.submitting}
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" aria-hidden="true" />
                {SURVEY_ANSWER_TEXT.submit}
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}
