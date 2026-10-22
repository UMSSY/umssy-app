"use client";

import Link from "next/link";
import { cn } from "cn";
import { FilePenLine } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDateTime } from "@/shared/utils/date.utils";
import { getSurveyEditPath, SURVEY_RESUME_PATH } from "../constants/surveys.constants";
import { useSavedSurveyFormDraft } from "../hooks/use-saved-survey-form-draft";

// Aparece solo si hay una encuesta sin publicar guardada en el navegador.
export function SurveyDraftResumeBanner() {
  const { draft, discard } = useSavedSurveyFormDraft();

  if (!draft) return null;

  const title = draft.values.title.trim() || "Encuesta sin título";
  const resumeHref = draft.surveyId ? `${getSurveyEditPath(draft.surveyId)}?resume=1` : SURVEY_RESUME_PATH;

  return (
    <section
      aria-label="Encuesta sin publicar"
      className="flex flex-col gap-3 rounded-lg border border-gold/50 bg-gold/10 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <FilePenLine className="mt-0.5 size-5 shrink-0 text-ink-soft" aria-hidden="true" />
        <p className="text-sm text-ink">
          Tienes una encuesta sin publicar: <span className="font-semibold">{title}</span>
          <span className="block text-xs text-text-secondary">Último cambio: {formatDateTime(draft.savedAt)}</span>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="ghost" onClick={discard} className="text-text-secondary hover:text-ink">
          Descartar
        </Button>
        <Link href={resumeHref} className={cn(buttonVariants(), "bg-ink text-surface hover:bg-ink-soft")}>
          Retomar encuesta
        </Link>
      </div>
    </section>
  );
}
