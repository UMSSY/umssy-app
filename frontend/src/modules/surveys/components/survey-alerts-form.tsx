"use client";

import { useId, useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SURVEY_ALERT_THRESHOLD_MAX, SURVEY_ALERT_THRESHOLD_MIN, SURVEY_ALERTS_TEXT } from "../constants/survey-participation.constants";
import type { SurveyAlertFormErrors } from "../types/survey-alert-form-errors.types";
import type { SurveyAlertsFormProps } from "../types/survey-alerts-dialog-props.types";
import { parseAlertThreshold, validateSurveyAlertForm } from "../utils/validate-survey-alert-form";

export function SurveyAlertsForm({ questions, config, isSaving, onCancel, onSave }: SurveyAlertsFormProps) {
  const fieldId = useId();
  const availableIds = (questions ?? []).map((question) => question.id);
  const [enabled, setEnabled] = useState(config.enabled);
  const [threshold, setThreshold] = useState(String(config.threshold));
  const [questionIds, setQuestionIds] = useState<string[]>(
    config.questionIds ? config.questionIds.filter((id) => availableIds.includes(id)) : availableIds,
  );
  const [errors, setErrors] = useState<SurveyAlertFormErrors>({});
  const isDisabled = !enabled || isSaving;
  const thresholdId = `${fieldId}-threshold`;
  const thresholdHintId = `${fieldId}-threshold-hint`;
  const thresholdErrorId = `${fieldId}-threshold-error`;
  const questionsErrorId = `${fieldId}-questions-error`;

  const toggleQuestion = (id: string, checked: boolean) => {
    setQuestionIds((current) => (checked ? [...current.filter((item) => item !== id), id] : current.filter((item) => item !== id)));
    setErrors((current) => ({ ...current, questions: undefined }));
  };

  const setAllQuestions = (ids: string[]) => {
    setQuestionIds(ids);
    setErrors((current) => ({ ...current, questions: undefined }));
  };

  const handleSave = async () => {
    const nextErrors = validateSurveyAlertForm({ enabled, threshold, questionIds });
    setErrors(nextErrors);
    if (nextErrors.threshold || nextErrors.questions) return;

    await onSave({
      enabled,
      threshold: parseAlertThreshold(threshold) ?? config.threshold,
      questionIds: availableIds.filter((id) => questionIds.includes(id)),
    });
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-soft px-3 py-2.5">
          <Label htmlFor={`${fieldId}-enabled`} className="text-sm font-medium text-ink">
            {SURVEY_ALERTS_TEXT.enableLabel}
          </Label>
          <Switch
            id={`${fieldId}-enabled`}
            checked={enabled}
            onCheckedChange={(checked) => {
              setEnabled(checked);
              setErrors({});
            }}
            disabled={isSaving}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={thresholdId} className="text-sm font-medium text-ink">
            {SURVEY_ALERTS_TEXT.thresholdLabel}
          </Label>
          <div className="flex items-center gap-2">
            <div className="relative w-28">
              <Input
                id={thresholdId}
                type="number"
                inputMode="numeric"
                min={SURVEY_ALERT_THRESHOLD_MIN}
                max={SURVEY_ALERT_THRESHOLD_MAX}
                value={threshold}
                onChange={(event) => {
                  setThreshold(event.target.value);
                  setErrors((current) => ({ ...current, threshold: undefined }));
                }}
                disabled={isDisabled}
                aria-invalid={Boolean(errors.threshold)}
                aria-describedby={errors.threshold ? `${thresholdHintId} ${thresholdErrorId}` : thresholdHintId}
                className="pr-9 tabular-nums"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-secondary" aria-hidden="true">
                {SURVEY_ALERTS_TEXT.thresholdSuffix}
              </span>
            </div>
            <p id={thresholdHintId} className="text-xs text-text-secondary">
              {SURVEY_ALERTS_TEXT.thresholdHint}
            </p>
          </div>
          {errors.threshold && (
            <p id={thresholdErrorId} role="alert" className="text-xs font-medium text-destructive">
              {errors.threshold}
            </p>
          )}
        </div>

        <fieldset className="flex flex-col gap-2" aria-describedby={errors.questions ? questionsErrorId : undefined}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="flex items-center gap-2 text-sm font-medium text-ink">
              {SURVEY_ALERTS_TEXT.questionsLabel}
              <Badge variant="secondary" className="tabular-nums" aria-live="polite">
                {SURVEY_ALERTS_TEXT.selectedCount(questionIds.length, availableIds.length)}
              </Badge>
            </legend>
            <div className="flex items-center gap-1">
              <Button type="button" variant="link" size="xs" onClick={() => setAllQuestions(availableIds)} disabled={isDisabled}>
                {SURVEY_ALERTS_TEXT.selectAll}
              </Button>
              <Button type="button" variant="link" size="xs" onClick={() => setAllQuestions([])} disabled={isDisabled}>
                {SURVEY_ALERTS_TEXT.clearAll}
              </Button>
            </div>
          </div>

          {availableIds.length === 0 ? (
            <p className="text-xs text-text-secondary">{SURVEY_ALERTS_TEXT.noQuestions}</p>
          ) : (
            <ul className="flex max-h-60 flex-col gap-2 overflow-y-auto">
              {(questions ?? []).map((question) => {
                const checkboxId = `${fieldId}-question-${question.id}`;
                return (
                  <li key={question.id}>
                    <Label
                      htmlFor={checkboxId}
                      className="flex w-full cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-data-checked:border-primary/40 has-data-checked:bg-interaction has-data-disabled:cursor-not-allowed has-data-disabled:opacity-60"
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={questionIds.includes(question.id)}
                        onCheckedChange={(checked) => toggleQuestion(question.id, checked)}
                        disabled={isDisabled}
                        className="mt-0.5"
                      />
                      <span className="flex h-5 min-w-7 shrink-0 items-center justify-center rounded-md bg-ink px-1.5 text-xs font-bold text-surface">
                        {question.code}
                      </span>
                      <span className="text-sm leading-snug font-normal text-ink">{question.text}</span>
                    </Label>
                  </li>
                );
              })}
            </ul>
          )}
          {errors.questions && (
            <p id={questionsErrorId} role="alert" className="text-xs font-medium text-destructive">
              {errors.questions}
            </p>
          )}
        </fieldset>

        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-interaction p-3 text-xs text-ink">
          <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <p>
            <span className="font-semibold">{SURVEY_ALERTS_TEXT.exampleTitle}</span> {SURVEY_ALERTS_TEXT.example}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          {SURVEY_ALERTS_TEXT.cancel}
        </Button>
        <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {isSaving ? SURVEY_ALERTS_TEXT.saving : SURVEY_ALERTS_TEXT.save}
        </Button>
      </DialogFooter>
    </>
  );
}
