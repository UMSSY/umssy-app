"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DESCRIPTION_PREVIEW_CHARS, PUBLISHED_DIALOG_TEXT } from "../constants/vacancies.constants";
import type { CurrentCompany, PublishError } from "../types/job-offer.types";
import type { VacancyConditions } from "../types/vacancy-conditions.types";
import { ConfirmDialog } from "./confirm-dialog";
import { StepActions } from "./step-actions";

interface PreviewStepProps {
  conditions: VacancyConditions;
  company: CurrentCompany;
  isSubmitting: boolean;
  isPublished: boolean;
  error: PublishError | null;
  onPrevious: () => void;
  onConfirm: () => void;
  onFinish: () => void;
}

function formatDescription(description: string, isExpanded: boolean): string {
  const text = description.trim();
  if (isExpanded || text.length <= DESCRIPTION_PREVIEW_CHARS) return text;
  return `${text.slice(0, DESCRIPTION_PREVIEW_CHARS).trimEnd()}...`;
}

export function PreviewStep({
  conditions,
  company,
  isSubmitting,
  isPublished,
  error,
  onPrevious,
  onConfirm,
  onFinish,
}: PreviewStepProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const canExpand = conditions.description.trim().length > DESCRIPTION_PREVIEW_CHARS;
  const mapsLink = conditions.mapsLink.trim();

  return (
    <div className="mt-8 w-full">
      <h3 className="mb-4 text-lg font-semibold text-ink">
        Revisa tu publicación
      </h3>

      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-white p-8 shadow-none">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-[50px] items-center justify-center rounded-lg bg-ink text-lg font-bold tracking-wider text-white">
            {company.initials}
          </div>
          <div>
            <h4 className="text-base leading-tight font-extrabold text-ink">{company.name}</h4>
            <p className="text-sm text-text-secondary">Empresa de la publicación</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-ink">{conditions.title}</h2>
          <p className="mt-1 text-sm font-bold text-ink-soft">{conditions.category}</p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-surface-soft px-4 py-2.5 text-sm font-medium text-ink-soft">
            {conditions.modality}
          </div>
          <div className="rounded-md bg-surface-soft px-4 py-2.5 text-sm font-medium text-ink-soft">
            {conditions.contractType}
          </div>
          <div className="rounded-md bg-surface-soft px-4 py-2.5 text-sm font-medium text-ink-soft">
            {conditions.vacancyCount} {conditions.vacancyCount === "1" ? "vacante" : "vacantes"}
          </div>
          <div className="rounded-md bg-surface-soft px-4 py-2.5 text-sm font-medium text-ink-soft">
            {conditions.salary}
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed break-words whitespace-pre-line text-text-secondary">
          {formatDescription(conditions.description, isExpanded)}
          {canExpand && (
            <>
              {" "}
              <Button
                type="button"
                variant="link"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded((current) => !current)}
                className="h-auto p-0 font-semibold text-accent"
              >
                {isExpanded ? "Ver menos" : "Ver más"}
              </Button>
            </>
          )}
        </p>

        <Separator className="mb-5" />

        <div className="mb-5">
          <h4 className="mb-1 text-sm font-semibold text-ink">Idiomas</h4>
          <p className="text-sm text-text-secondary">{conditions.languages}</p>
        </div>

        <Separator className="mb-5" />

        <div className="mb-6">
          <h4 className="mb-1 text-sm font-semibold text-ink">Ubicación</h4>
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm break-all text-accent underline-offset-2 hover:underline"
          >
            {mapsLink}
          </a>
        </div>

        <ul className="flex flex-wrap gap-2" aria-label="Habilidades requeridas">
          {conditions.skills.map((skill) => (
            <li key={skill.id} className="rounded-full bg-interaction px-4 py-1.5 text-sm font-semibold text-ink-soft">
              {skill.name}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <Alert variant="destructive" className="mx-auto mt-6 max-w-3xl">
          <AlertTitle>{error.message}</AlertTitle>
          {error.details.length > 0 && (
            <AlertDescription>
              <ul className="list-disc pl-5">
                {error.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </AlertDescription>
          )}
        </Alert>
      )}

      <StepActions
        secondaryLabel="Anterior"
        primaryVariant="brand"
        primaryLabel={isSubmitting ? "Publicando..." : "Confirmar publicación"}
        onSecondary={onPrevious}
        onPrimary={onConfirm}
        isBusy={isSubmitting}
        className="mx-auto mt-8 max-w-3xl"
      />

      <ConfirmDialog
        isOpen={isPublished}
        title={PUBLISHED_DIALOG_TEXT.title}
        description={PUBLISHED_DIALOG_TEXT.description}
        confirmLabel={PUBLISHED_DIALOG_TEXT.confirm}
        onConfirm={onFinish}
      />
    </div>
  );
}
