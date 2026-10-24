"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageBreadcrumb } from "@/shared/components/layout/page-breadcrumb";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { AnswerQuestion } from "../components/answer-question";
import { SURVEY_NOTIFICATIONS_PATH } from "../constants/survey-notifications.constants";
import {
  SURVEY_RESPONSE_BREADCRUMB,
  SURVEY_RESPONSE_SKELETON_ROWS,
  SURVEY_RESPONSE_TEXT,
} from "../constants/survey-response.constants";
import { useSurveyToAnswer } from "../hooks/use-survey-to-answer";
import { surveyResponseService } from "../services/survey-response.service";
import type { SurveyResponseViewProps } from "../types/survey-response-props.types";
import type { SurveyAnswers } from "../types/survey-response.types";
import { findUnansweredQuestions } from "../utils/find-unanswered-questions";

export function SurveyResponseView({ surveyId }: SurveyResponseViewProps) {
  const router = useRouter();
  const { survey, isLoading, errorMessage } = useSurveyToAnswer(surveyId);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [missingIds, setMissingIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (questionId: string, value: string[]) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setMissingIds((current) => current.filter((id) => id !== questionId));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!survey) return;

    const unanswered = findUnansweredQuestions(survey.questions, answers);
    setMissingIds(unanswered);
    if (unanswered.length > 0) {
      toast.error(SURVEY_RESPONSE_TEXT.missingAnswers);
      return;
    }

    setIsSubmitting(true);
    await surveyResponseService.submitAnswers(survey.id, answers);
    toast.success(SURVEY_RESPONSE_TEXT.submitSuccess);
    router.push(SURVEY_NOTIFICATIONS_PATH);
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <Card className="p-6">
          <div aria-busy="true" className="space-y-4">
            {Array.from({ length: SURVEY_RESPONSE_SKELETON_ROWS }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        </Card>
      );
    }

    if (errorMessage) {
      return (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      );
    }

    if (!survey) {
      return (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <FileQuestion className="size-10 text-accent" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="font-tight text-lg font-bold text-ink">{SURVEY_RESPONSE_TEXT.notFoundTitle}</h2>
          <p className="text-sm text-text-secondary">{SURVEY_RESPONSE_TEXT.notFoundDescription}</p>
          <Link href={SURVEY_NOTIFICATIONS_PATH} className={buttonVariants({ variant: "outline" })}>
            {SURVEY_RESPONSE_TEXT.back}
          </Link>
        </Card>
      );
    }

    return (
      <form onSubmit={handleSubmit} noValidate aria-label={survey.title}>
        <Card className="gap-0 py-0">
          <CardContent className="max-h-[60vh] divide-y divide-border overflow-y-auto px-6 py-5">
            {survey.questions.map((question) => (
              <AnswerQuestion
                key={question.id}
                question={question}
                value={answers[question.id] ?? []}
                error={missingIds.includes(question.id) ? SURVEY_RESPONSE_TEXT.requiredAnswer : undefined}
                onChange={handleChange}
              />
            ))}
          </CardContent>
          <CardFooter className="justify-end border-t border-border px-6 py-4">
            <Button type="submit" variant="brand" disabled={isSubmitting}>
              {SURVEY_RESPONSE_TEXT.submit}
              <ChevronRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          </CardFooter>
        </Card>
      </form>
    );
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <PageBreadcrumb items={[...SURVEY_RESPONSE_BREADCRUMB, { label: survey?.title ?? SURVEY_RESPONSE_TEXT.notFoundTitle }]} />
      {survey && <PageHeading title={survey.title} description={survey.description ?? undefined} className="border-b-0 pb-0" />}
      {renderBody()}
    </main>
  );
}
