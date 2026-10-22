"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert, Eye, Plus, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SURVEY_MAX_QUESTIONS } from "../constants/survey-form.constants";
import { SURVEYS_BASE_PATH } from "../constants/surveys.constants";
import { useSaveSurvey } from "../hooks/use-save-survey";
import { useSurveyForm } from "../hooks/use-survey-form";
import type { SurveyFormProps } from "../types/survey-form-props.types";
import type { SurveyHeaderField } from "../types/survey-form.types";
import { buildSurveyPublishSummary } from "../utils/build-survey-publish-summary";
import { toSurveyInput } from "../utils/survey-form-reducer";
import { SurveyCancelDialog } from "./survey-cancel-dialog";
import { SurveyDetailsCard } from "./survey-details-card";
import { SurveyFormErrorBanner } from "./survey-form-error-banner";
import { SurveyPreviewDialog } from "./survey-preview-dialog";
import { SurveyPublishDialog } from "./survey-publish-dialog";
import { SurveyQuestionCard } from "./survey-question-card";
import { SurveyStatusBadge } from "./survey-status-badge";

const HEADER_FIELDS: SurveyHeaderField[] = ["title", "description", "targetCareer", "period", "opensAt", "closesAt"];

function scrollToTop() {
  window.scrollTo?.({ top: 0, behavior: "smooth" });
}

export function SurveyForm({ surveyId, initialValues, startsDirty = false }: SurveyFormProps) {
  const router = useRouter();
  const { state, dispatch, errors, validate } = useSurveyForm(surveyId, initialValues, startsDirty);
  const { saveDraft, publish, isSaving, errorMessage } = useSaveSurvey(surveyId, () => dispatch({ type: "markSaved" }));
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { values, activeKey, isDirty } = state;
  const canAddQuestion = values.questions.length < SURVEY_MAX_QUESTIONS;
  const headerErrors = Object.fromEntries(HEADER_FIELDS.map((field) => [field, errors.byField[field]]));

  const handleSaveDraft = () => {
    if (!validate("draft")) return scrollToTop();
    saveDraft(toSurveyInput(values));
  };

  const handlePublish = () => {
    if (!validate("publish")) return scrollToTop();
    setIsPublishOpen(true);
  };

  const handleConfirmPublish = () => {
    publish(toSurveyInput(values), { onError: () => setIsPublishOpen(false) });
  };

  const handleCancel = () => {
    if (isDirty) setIsCancelOpen(true);
    else router.push(SURVEYS_BASE_PATH);
  };

  return (
    <WorkspacePage
      title={surveyId ? "Editar encuesta" : "Crear encuesta"}
      description="Las encuestas se guardan como borrador hasta que las publiques."
    >
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving} className="gap-2">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Cancelar
        </Button>
        <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(true)} className="gap-2">
          <Eye className="size-4" aria-hidden="true" />
          Vista previa
        </Button>
        <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isSaving} className="gap-2">
          <Save className="size-4" aria-hidden="true" />
          Guardar borrador
        </Button>
        <Button type="button" onClick={handlePublish} disabled={isSaving} className="gap-2 bg-ink text-surface hover:bg-ink-soft">
          <Send className="size-4" aria-hidden="true" />
          Publicar encuesta
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          Estado: <SurveyStatusBadge status="DRAFT" />
        </div>

        {errorMessage && (
          <p role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
            {errorMessage}
          </p>
        )}

        <SurveyFormErrorBanner errors={errors.list} />

        <SurveyDetailsCard
          values={values}
          errors={headerErrors}
          onChange={(field, value) => dispatch({ type: "setField", field, value })}
        />

        {values.questions.map((question, index) => (
          <SurveyQuestionCard
            key={question.key}
            question={question}
            index={index}
            isActive={question.key === activeKey}
            errors={{ text: errors.byField[`questions.${index}.text`], options: errors.byField[`questions.${index}.options`] }}
            canRemove={values.questions.length > 1}
            canAddQuestion={canAddQuestion}
            onActivate={() => dispatch({ type: "setActive", key: question.key })}
            onChange={(changes) => dispatch({ type: "updateQuestion", key: question.key, changes })}
            onAddOption={() => dispatch({ type: "addOption", key: question.key })}
            onUpdateOption={(optionIndex, text) => dispatch({ type: "updateOption", key: question.key, index: optionIndex, text })}
            onRemoveOption={(optionIndex) => dispatch({ type: "removeOption", key: question.key, index: optionIndex })}
            onDuplicate={() => dispatch({ type: "duplicateQuestion", key: question.key })}
            onRemove={() => dispatch({ type: "removeQuestion", key: question.key })}
            onAddQuestion={() => dispatch({ type: "addQuestion" })}
            onPreview={() => setIsPreviewOpen(true)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          disabled={!canAddQuestion}
          onClick={() => dispatch({ type: "addQuestion" })}
          className="h-12 w-full gap-2 border-border bg-surface text-sm font-semibold text-ink"
        >
          <Plus className="size-4" aria-hidden="true" />
          Añadir pregunta
        </Button>
      </div>

      <SurveyPreviewDialog open={isPreviewOpen} values={values} onOpenChange={setIsPreviewOpen} />
      <SurveyPublishDialog
        open={isPublishOpen}
        summary={buildSurveyPublishSummary(toSurveyInput(values))}
        isPublishing={isSaving}
        onOpenChange={setIsPublishOpen}
        onConfirm={handleConfirmPublish}
      />
      <SurveyCancelDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        onConfirm={() => router.push(SURVEYS_BASE_PATH)}
      />
    </WorkspacePage>
  );
}
