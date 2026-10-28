"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CONNECTION_ERROR_MESSAGE } from "@/modules/reports";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { isConnectionError } from "@/shared/utils/is-connection-error";
import { AddQuestionButton } from "./add-question-button";
import { DiscardChangesDialog } from "./discard-changes-dialog";
import { PublishSurveyDialog } from "./publish-survey-dialog";
import { QuestionCard } from "./question-card";
import { SurveyBuilderTopbar } from "./survey-builder-topbar";
import { SurveyHeaderCard } from "./survey-header-card";
import { SurveyPreviewDialog } from "./survey-preview-dialog";
import { SurveyValidationAlert } from "./survey-validation-alert";
import { SURVEY_FIELD_ERROR_DEPENDENCIES, SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { SURVEYS_PATH } from "../constants/survey-routes.constants";
import { SURVEY_TOAST_DURATION_MS } from "../constants/surveys-query-keys.constants";
import { useCareers } from "../hooks/use-careers";
import { useSurveyBuilder } from "../hooks/use-survey-builder";
import { useUnsavedChangesGuard } from "../hooks/use-unsaved-changes-guard";
import type { SurveyFieldName } from "../types/survey-builder.types";
import type { SurveyEditorProps } from "../types/survey-component-props.types";
import type { SurveyValidationError } from "../types/survey-validation.types";
import type { SurveyStatus } from "../types/survey.types";
import { getErrorQuestionId, getErrorTargetId, revealElement } from "../utils/get-error-target-id";
import { mapApiErrors } from "../utils/map-api-errors";
import { getSurveyYears } from "../utils/survey-academic-periods";
import { getBoliviaTodayValue, toCalendarDate } from "../utils/survey-dates";
import { toCreateSurveyPayload } from "../utils/to-create-survey-payload";
import { toErrorMap, validateDraft, validateSurvey } from "../utils/validate-survey";

export function SurveyEditor({ title, initialState, isSaving, pendingStatus, draftSavedMessage, onSave }: SurveyEditorProps) {
  const router = useRouter();
  const builder = useSurveyBuilder(initialState);
  const { state } = builder;
  const { careers, isLoading: isLoadingCareers, hasError: hasCareersError } = useCareers();
  const [academicPeriods] = useState(() => getSurveyYears());
  const [today] = useState(() => getBoliviaTodayValue());
  const [hasAttemptedPublish, setHasAttemptedPublish] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<SurveyValidationError[]>([]);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const { pendingHref, clearPendingHref } = useUnsavedChangesGuard(state.isDirty);

  const minDate = toCalendarDate(today) ?? new Date();
  const careerTitle = careers.find(({ id }) => id === state.careerId)?.title ?? "";
  const clientErrors = hasAttemptedPublish ? validateSurvey(state, today) : [];
  const visibleErrors = [
    ...clientErrors,
    ...submitErrors.filter((error) => !clientErrors.some(({ path }) => path === error.path)),
  ];
  const errorMap = toErrorMap(visibleErrors);
  const questions = state.questions ?? [];

  const dismissSubmitErrors = (matches: (path: string) => boolean) => {
    setSubmitErrors((current) => (current.some(({ path }) => matches(path)) ? current.filter(({ path }) => !matches(path)) : current));
  };

  const revealError = (error: SurveyValidationError | undefined) => {
    if (!error) return;
    const questionId = getErrorQuestionId(error.path, questions);
    if (questionId) builder.setActiveQuestion(questionId);
    const targetId = getErrorTargetId(error.path, questions);
    requestAnimationFrame(() => revealElement(targetId));
  };

  const handleFieldChange = (field: SurveyFieldName, value: string) => {
    builder.updateField(field, value);
    dismissSubmitErrors((path) => SURVEY_FIELD_ERROR_DEPENDENCIES[field].includes(path));
  };

  const withQuestionChange = <TArgs extends unknown[]>(action: (...args: TArgs) => void) => (...args: TArgs) => {
    action(...args);
    dismissSubmitErrors((path) => path.startsWith("questions"));
  };

  const submit = async (status: SurveyStatus) => {
    try {
      await onSave(toCreateSurveyPayload(state, status));
      builder.markSaved();
      setIsPublishDialogOpen(false);
      toast.success(status === "published" ? SURVEY_MESSAGES.publishSuccess : draftSavedMessage, {
        richColors: true,
      });
      router.push(SURVEYS_PATH);
    } catch (error) {
      if (isConnectionError(error)) {
        toast.error(CONNECTION_ERROR_MESSAGE, {
          duration: SURVEY_TOAST_DURATION_MS,
          closeButton: true,
          richColors: true,
        });
        return;
      }

      setIsPublishDialogOpen(false);
      const apiErrors = mapApiErrors(error);
      if (apiErrors.length > 0) {
        setSubmitErrors(apiErrors);
        if (status === "published") setHasAttemptedPublish(true);
        toast.error(apiErrors[0].message, { richColors: true });
        revealError(apiErrors[0]);
        return;
      }

      toast.error(getApiErrorDetail(error) ?? SURVEY_MESSAGES.saveError, { richColors: true });
    }
  };

  const handlePublish = () => {
    setHasAttemptedPublish(true);
    const errors = validateSurvey(state, today);
    if (errors.length > 0) {
      revealError(errors[0]);
      return;
    }
    setIsPublishDialogOpen(true);
  };

  const handleSaveDraft = () => {
    const errors = validateDraft(state);
    if (errors.length > 0) {
      setSubmitErrors(errors);
      toast.error(SURVEY_MESSAGES.draftNeedsTitle, { richColors: true });
      revealError(errors[0]);
      return;
    }
    void submit("draft");
  };

  const handleCancel = () => {
    if (state.isDirty) {
      setIsDiscardDialogOpen(true);
      return;
    }
    router.push(SURVEYS_PATH);
  };

  const handleDiscardOpenChange = (open: boolean) => {
    if (open) return;
    setIsDiscardDialogOpen(false);
    clearPendingHref();
  };

  const handleConfirmDiscard = () => {
    const target = pendingHref ?? SURVEYS_PATH;
    setIsDiscardDialogOpen(false);
    clearPendingHref();
    builder.markSaved();
    router.push(target);
  };

  const resetDrag = () => {
    setDraggedIndex(null);
    setDropIndex(null);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null) withQuestionChange(builder.moveQuestion)(draggedIndex, index);
    resetDrag();
  };

  return (
    <div className="min-w-0">
      <SurveyBuilderTopbar
        title={title}
        isSaving={isSaving}
        onCancel={handleCancel}
        onPreview={() => setIsPreviewOpen(true)}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 pt-5 pb-28">
        {hasAttemptedPublish && <SurveyValidationAlert errors={visibleErrors} />}

        <SurveyHeaderCard
          values={state}
          careers={careers}
          isLoadingCareers={isLoadingCareers}
          careersErrorMessage={hasCareersError ? SURVEY_MESSAGES.careersLoadError : undefined}
          academicPeriods={academicPeriods}
          minDate={minDate}
          errors={errorMap}
          onFieldChange={handleFieldChange}
        />

        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            isActive={state.activeQuestionId === question.id}
            isDragging={draggedIndex === index}
            isDropTarget={dropIndex === index && draggedIndex !== null}
            shouldFocusStatement={state.pendingFocus?.questionId === question.id && !state.pendingFocus.optionId}
            focusOptionId={state.pendingFocus?.questionId === question.id ? state.pendingFocus.optionId : undefined}
            errors={errorMap}
            canMoveUp={index > 0}
            canMoveDown={index < questions.length - 1}
            onActivate={builder.setActiveQuestion}
            onStatementChange={withQuestionChange(builder.updateStatement)}
            onTypeChange={builder.changeType}
            onToggleRequired={builder.toggleRequired}
            onAddOption={withQuestionChange(builder.addOption)}
            onRemoveOption={withQuestionChange(builder.removeOption)}
            onOptionChange={withQuestionChange(builder.updateOption)}
            onDuplicate={withQuestionChange(builder.duplicateQuestion)}
            onRemove={withQuestionChange(builder.removeQuestion)}
            onAddQuestionAfter={withQuestionChange(builder.addQuestion)}
            onPreview={() => setIsPreviewOpen(true)}
            onMove={withQuestionChange(builder.moveQuestion)}
            onFocusHandled={builder.clearPendingFocus}
            onDragStart={setDraggedIndex}
            onDragEnter={setDropIndex}
            onDragEnd={resetDrag}
            onDrop={handleDrop}
          />
        ))}

        <AddQuestionButton onClick={() => withQuestionChange(builder.addQuestion)()} />
      </div>

      <PublishSurveyDialog
        open={isPublishDialogOpen}
        survey={state}
        careerTitle={careerTitle}
        isPublishing={pendingStatus === "published"}
        onOpenChange={setIsPublishDialogOpen}
        onConfirm={() => void submit("published")}
      />
      <SurveyPreviewDialog open={isPreviewOpen} survey={state} careerTitle={careerTitle} onOpenChange={setIsPreviewOpen} />
      <DiscardChangesDialog
        open={isDiscardDialogOpen || pendingHref !== null}
        onOpenChange={handleDiscardOpenChange}
        onConfirm={handleConfirmDiscard}
      />
    </div>
  );
}
