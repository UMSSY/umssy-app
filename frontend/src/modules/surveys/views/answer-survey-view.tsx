"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageBreadcrumb } from "@/shared/components/layout/page-breadcrumb";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { readSurveyStorage, removeSurveyStorage, writeSurveyStorage } from "../utils/survey-draft-storage";
import { SurveyQuestionField } from "../components/survey-question-field";
import { SURVEY_ANSWER_BREADCRUMB, SURVEY_ANSWER_HINTS, SURVEY_ANSWER_TEXT, SURVEY_ANSWERS_STORAGE_KEY } from "../constants/survey-answer.constants";
import { SURVEY_NOTIFICATIONS_PATH } from "../constants/survey-notifications.constants";
import { useSurveyDetail } from "../hooks/use-survey-detail";
import { useSubmitSurveyAnswers } from "../hooks/use-submit-survey-answers";
import type { AnswerSurveyViewProps } from "../types/answer-survey-view-props.types";

export function AnswerSurveyView({ id }: AnswerSurveyViewProps) {
  const router = useRouter();
  const { survey, isLoading, errorMessage } = useSurveyDetail(id);
  const submitAnswers = useSubmitSurveyAnswers(id);
  const isSubmitting = submitAnswers.isPending;
  const storageKey = SURVEY_ANSWERS_STORAGE_KEY(id);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  useEffect(() => {
    let isActive = true;
    void readSurveyStorage<Record<string, string[]>>(storageKey).then((storedAnswers) => {
      if (!isActive) return;
      if (storedAnswers) setSelectedAnswers(storedAnswers);
      setIsDraftRestored(true);
    });
    return () => {
      isActive = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!isDraftRestored || isSubmittedSuccess) return;
    if (Object.keys(selectedAnswers).length === 0) return;
    void writeSurveyStorage(storageKey, selectedAnswers);
  }, [isDraftRestored, isSubmittedSuccess, selectedAnswers, storageKey]);

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
      toast.error(SURVEY_ANSWER_TEXT.missingAnswers);
      const [firstInvalidId] = Object.keys(errors);
      document
        .getElementById(`question-${firstInvalidId}-card`)
        ?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      const answers = Object.entries(selectedAnswers)
        .filter(([, optionIds]) => optionIds.length > 0)
        .map(([questionId, optionIds]) => ({ questionId, optionIds }));

      await submitAnswers.mutateAsync({ answers });
      void removeSurveyStorage(storageKey);
      setIsSubmittedSuccess(true);
      toast.success(SURVEY_ANSWER_TEXT.submitSuccess);
      setTimeout(() => router.push(SURVEY_NOTIFICATIONS_PATH), 1500);
    } catch (error: unknown) {
      toast.error(getApiErrorDetail(error) ?? (error instanceof Error ? error.message : SURVEY_ANSWER_TEXT.submitError));
    }
  };

  if (isLoading || !isDraftRestored) {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-6">
        <Skeleton className="h-4 w-64" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div aria-busy="true" className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </main>
    );
  }

  if (!survey) {
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
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <PageBreadcrumb items={[...SURVEY_ANSWER_BREADCRUMB, { label: survey.title }]} />
      <PageHeading title={survey.title} description={survey.description ?? undefined} className="border-b-0 pb-0" />

      <form onSubmit={handleSubmit} noValidate aria-label={survey.title}>
        <Card className="gap-0 py-0">
          <CardContent className="divide-y divide-border px-6 py-5">
            {(survey.questions ?? []).map((question, index) => (
              <SurveyQuestionField
                key={question.id}
                variant="plain"
                idPrefix={"question"}
                question={question}
                index={index}
                hint={question.type === "multiple_choice" ? SURVEY_ANSWER_HINTS.multiple_choice : undefined}
                selectedOptionIds={selectedAnswers[question.id] ?? []}
                onChange={(optionIds) => handleAnswerChange(question.id, optionIds)}
                error={validationErrors[question.id]}
              />
            ))}
          </CardContent>
          <CardFooter className="justify-end border-t border-border px-6 py-4">
            <Button type="submit" variant="brand" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  {SURVEY_ANSWER_TEXT.submitting}
                </>
              ) : (
                <>
                  {SURVEY_ANSWER_TEXT.submit}
                  <ChevronRight data-icon="inline-end" aria-hidden="true" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  );
}
