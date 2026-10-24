"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { RequiredMark } from "../components/required-mark";
import { surveysService } from "../services/surveys.service";
import type { SurveyToAnswer } from "../types/survey-answer.types";
import { formatSurveyDate } from "../utils/format-survey-date";

export interface AnswerSurveyViewProps {
  id: string;
}

export function AnswerSurveyView({ id }: AnswerSurveyViewProps) {
  const router = useRouter();
  const [survey, setSurvey] = useState<SurveyToAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSurvey() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await surveysService.getSurveyToAnswer(id);
        if (isMounted) {
          setSurvey(response.data);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : "No se pudo cargar la encuesta solicitada",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSurvey();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSingleChoice = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: [optionId],
    }));
    setValidationErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleMultipleChoice = (questionId: string, optionId: string, checked: boolean) => {
    setSelectedAnswers((prev) => {
      const current = prev[questionId] ?? [];
      const updated = checked
        ? [...current, optionId]
        : current.filter((opt) => opt !== optionId);
      return {
        ...prev,
        [questionId]: updated,
      };
    });
    setValidationErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey || isSubmitting) return;

    // Validate required questions
    const errors: Record<string, string> = {};
    for (const question of survey.questions) {
      if (question.isRequired) {
        const answers = selectedAnswers[question.id];
        if (!answers || answers.length === 0) {
          errors[question.id] = "Esta pregunta es obligatoria. Por favor selecciona una opción.";
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstInvalidId = Object.keys(errors)[0];
      const el = document.getElementById(`question-card-${firstInvalidId}`);
      el?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      setIsSubmitting(true);
      const payloadAnswers = Object.entries(selectedAnswers)
        .filter(([, optionIds]) => optionIds.length > 0)
        .map(([questionId, optionIds]) => ({
          questionId,
          optionIds,
        }));

      await surveysService.submitAnswers(id, { answers: payloadAnswers });
      setIsSubmittedSuccess(true);
      toast.success("¡Respuestas registradas exitosamente!");
      setTimeout(() => {
        router.push("/surveys");
      }, 1500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Ocurrió un error al enviar las respuestas";
      toast.error(msg);
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
          <h2 className="text-xl font-bold text-ink">No se pudo cargar la encuesta</h2>
          <p className="mt-2 text-sm text-text-secondary">
            {errorMessage ?? "La encuesta no existe o no se encuentra disponible."}
          </p>
          <div className="mt-6">
            <Link href="/surveys" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="mr-2 size-4" />
              Volver a encuestas
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
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-2xl font-bold text-ink">¡Encuesta completada!</h2>
          <p className="text-sm text-text-secondary">
            Tus respuestas para <span className="font-medium text-ink">&ldquo;{survey.title}&rdquo;</span> han sido
            registradas correctamente. Muchas gracias por tu valiosa participación.
          </p>
          <div className="pt-4">
            <Link href="/surveys" className={buttonVariants({ variant: "brand" })}>
              Volver a notificaciones de encuestas
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
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock className="size-8" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Encuesta caducada</h2>
          <p className="text-sm text-text-secondary">
            El plazo para responder <span className="font-medium text-ink">&ldquo;{survey.title}&rdquo;</span> ha
            finalizado y ya no admite nuevas respuestas.
          </p>
          <div className="pt-4">
            <Link href="/surveys" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="mr-2 size-4" />
              Volver a la lista de encuestas
            </Link>
          </div>
        </div>
      </main>
    );
  }


  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      {/* Navigation breadcrumb/back */}
      <div>
        <Link
          href="/surveys"
          className="inline-flex items-center text-sm font-medium text-text-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          Volver a encuestas
        </Link>
      </div>

      {/* Survey Title & Header info */}
      <section className="rounded-xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            Encuesta para Titulados
          </Badge>
          {survey.academicPeriod ? (
            <Badge variant="secondary">{survey.academicPeriod}</Badge>
          ) : null}
          {survey.closesAt ? (
            <span className="text-xs text-text-secondary">
              Vence el: {formatSurveyDate(survey.closesAt)}
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{survey.title}</h1>

        {survey.description ? (
          <p className="mt-3 text-base text-text-secondary">{survey.description}</p>
        ) : null}

        <p className="mt-4 text-xs text-text-secondary">
          Los campos marcados con <span className="font-bold text-danger">*</span> son obligatorios.
        </p>
      </section>

      {/* Questions form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {survey.questions.map((question, index) => {
          const isError = !!validationErrors[question.id];
          const baseId = `question-${question.id}`;

          return (
            <fieldset
              key={question.id}
              id={`question-card-${question.id}`}
              className={cn(
                "rounded-xl border bg-surface p-6 shadow-xs transition-colors",
                isError ? "border-danger ring-1 ring-danger/30" : "border-border",
              )}
            >
              <legend className="float-left mb-3 w-full text-base font-semibold text-ink">
                <span className="mr-1 text-primary">{index + 1}.</span>
                {question.statement}
                {question.isRequired && <RequiredMark className="ml-1" />}
              </legend>

              <p className="clear-both mb-4 text-xs font-normal text-text-secondary">
                {question.type === "single_choice"
                  ? "Selecciona una opción"
                  : "Selecciona una o más opciones"}
              </p>

              {/* Single choice RadioGroup */}
              {question.type === "single_choice" && (
                <RadioGroup
                  value={selectedAnswers[question.id]?.[0] ?? ""}
                  onValueChange={(val) => handleSingleChoice(question.id, val)}
                  className="clear-both flex flex-col gap-2.5"
                >
                  {question.options.map((option) => {
                    const isSelected = selectedAnswers[question.id]?.[0] === option.id;
                    return (
                      <div
                        key={option.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3.5 transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5 text-ink"
                            : "border-border bg-surface text-ink hover:bg-muted",
                        )}
                      >
                        <RadioGroupItem id={`${baseId}-${option.id}`} value={option.id} />
                        <Label
                          id={`${baseId}-${option.id}-label`}
                          htmlFor={`${baseId}-${option.id}`}
                          className="flex-1 cursor-pointer text-sm font-medium"
                        >
                          {option.label}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}

              {/* Multiple choice Checkboxes */}
              {question.type === "multiple_choice" && (
                <div className="clear-both flex flex-col gap-2.5">
                  {question.options.map((option) => {
                    const isChecked = selectedAnswers[question.id]?.includes(option.id) ?? false;
                    return (
                      <div
                        key={option.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3.5 transition-colors",
                          isChecked
                            ? "border-primary bg-primary/5 text-ink"
                            : "border-border bg-surface text-ink hover:bg-muted",
                        )}
                      >
                        <Checkbox
                          id={`${baseId}-${option.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleMultipleChoice(question.id, option.id, !!checked)
                          }
                        />
                        <Label
                          id={`${baseId}-${option.id}-label`}
                          htmlFor={`${baseId}-${option.id}`}
                          className="flex-1 cursor-pointer text-sm font-medium"
                        >
                          {option.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}

              {isError && (
                <p className="mt-3 text-xs font-medium text-danger">
                  {validationErrors[question.id]}
                </p>
              )}
            </fieldset>
          );
        })}

        {/* Submit Actions */}
        <div className="flex flex-col-reverse gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <Link
            href="/surveys"
            className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
          >
            Cancelar
          </Link>
          <Button
            type="submit"
            variant="brand"
            disabled={isSubmitting}
            className="w-full min-w-36 sm:w-auto"
          >

            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Enviando respuestas...
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" />
                Enviar respuestas
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}

