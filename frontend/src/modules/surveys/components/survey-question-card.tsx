"use client";

import { useEffect, useRef } from "react";
import { cn } from "cn";
import { Asterisk, Copy, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  SURVEY_MAX_OPTIONS,
  SURVEY_MIN_OPTIONS,
  SURVEY_OPTION_MAX_LENGTH,
  SURVEY_QUESTION_MAX_LENGTH,
  SURVEY_QUESTION_TYPE_LABELS,
  UNTITLED_QUESTION_PLACEHOLDER,
} from "../constants/survey-form.constants";
import { SURVEY_QUESTION_TYPE_ICONS } from "../constants/survey-question-icons.constants";
import type { SurveyQuestionCardProps } from "../types/survey-question-card-props.types";
import { SurveyFieldError } from "./survey-field-error";
import { SurveyOptionMarker } from "./survey-option-marker";
import { SurveyQuestionTypeSelect } from "./survey-question-type-select";
import { SurveyQuestionToolbar } from "./survey-question-toolbar";

export function SurveyQuestionCard({
  question,
  index,
  isActive,
  errors,
  canRemove,
  canAddQuestion,
  onActivate,
  onChange,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onDuplicate,
  onRemove,
  onAddQuestion,
  onPreview,
}: SurveyQuestionCardProps) {
  const number = index + 1;
  const hasErrors = Boolean(errors.text || errors.options);
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);
  const previousOptionCount = useRef(question.options.length);

  // Al añadir una opción, el foco pasa a la nueva para escribir de inmediato.
  useEffect(() => {
    if (question.options.length > previousOptionCount.current) {
      optionRefs.current[question.options.length - 1]?.focus();
    }
    previousOptionCount.current = question.options.length;
  }, [question.options.length]);

  if (!isActive) {
    const TypeIcon = SURVEY_QUESTION_TYPE_ICONS[question.type];
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={onActivate}
        aria-label={`Editar pregunta ${number}`}
        className={cn(
          "flex h-auto w-full flex-col items-start gap-2 rounded-lg border bg-surface px-5 py-4 text-left font-normal whitespace-normal hover:border-border-strong hover:bg-surface",
          hasErrors ? "border-destructive" : "border-border",
        )}
      >
        <span className="flex items-start gap-1 text-sm font-semibold text-ink">
          {number}. {question.text.trim() || UNTITLED_QUESTION_PLACEHOLDER}
          {question.isRequired && <Asterisk className="size-3.5 shrink-0 text-destructive" aria-label="Obligatoria" />}
        </span>
        <span className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-soft px-2 py-0.5">
            <TypeIcon className="size-3.5" aria-hidden="true" />
            {SURVEY_QUESTION_TYPE_LABELS[question.type]}
          </span>
          {question.options.length} opciones
        </span>
        {hasErrors && <span className="text-xs text-destructive">{errors.text ?? errors.options}</span>}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <section
        aria-label={`Pregunta ${number}`}
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-4 rounded-lg border border-l-4 bg-surface p-5 shadow-sm",
          hasErrors ? "border-destructive" : "border-border border-l-ink",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Input
              value={question.text}
              maxLength={SURVEY_QUESTION_MAX_LENGTH}
              placeholder={`${number}. ${UNTITLED_QUESTION_PLACEHOLDER}`}
              aria-label={`Enunciado de la pregunta ${number}`}
              aria-invalid={Boolean(errors.text)}
              aria-describedby={`question-${question.key}-text-error`}
              onChange={(event) => onChange({ text: event.target.value })}
              className={cn(
                "h-11 rounded-none border-0 border-b-2 bg-surface-soft px-3 text-sm text-ink shadow-none focus-visible:ring-0",
                errors.text ? "border-destructive" : "border-ink-soft focus-visible:border-ink",
              )}
            />
            <SurveyFieldError id={`question-${question.key}-text-error`} message={errors.text} />
          </div>
          <SurveyQuestionTypeSelect value={question.type} questionNumber={number} onChange={(type) => onChange({ type })} />
        </div>

        <ul className="flex flex-col gap-1" aria-label={`Opciones de la pregunta ${number}`}>
          {question.options.map((option, optionIndex) => (
            <li key={optionIndex} className="flex items-center gap-3">
              <SurveyOptionMarker type={question.type} index={optionIndex} />
              <Input
                ref={(element) => {
                  optionRefs.current[optionIndex] = element;
                }}
                value={option}
                maxLength={SURVEY_OPTION_MAX_LENGTH}
                aria-label={`Opción ${optionIndex + 1} de la pregunta ${number}`}
                onChange={(event) => onUpdateOption(optionIndex, event.target.value)}
                className="h-9 flex-1 rounded-none border-0 border-b border-transparent px-1 text-sm text-ink shadow-none hover:border-border focus-visible:border-ink focus-visible:ring-0"
              />
              {question.options.length > SURVEY_MIN_OPTIONS && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Eliminar opción ${optionIndex + 1}`}
                  onClick={() => onRemoveOption(optionIndex)}
                  className="text-text-secondary hover:text-ink"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1.5">
          {question.options.length < SURVEY_MAX_OPTIONS && (
            <Button
              type="button"
              variant="ghost"
              onClick={onAddOption}
              className="w-fit px-1 text-sm font-semibold text-primary hover:bg-transparent hover:underline"
            >
              Añadir opción
            </Button>
          )}
          <SurveyFieldError id={`question-${question.key}-options-error`} message={errors.options} />
        </div>

        <div className="flex items-center justify-end gap-1 border-t border-border pt-3">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Duplicar pregunta ${number}`} onClick={onDuplicate}>
            <Copy className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Eliminar pregunta ${number}`}
            disabled={!canRemove}
            onClick={onRemove}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
          <span className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            Obligatoria
            <Switch checked={question.isRequired} onCheckedChange={(checked) => onChange({ isRequired: checked })} />
          </label>
        </div>
      </section>

      <SurveyQuestionToolbar
        canAddQuestion={canAddQuestion}
        onAddQuestion={onAddQuestion}
        onDuplicate={onDuplicate}
        onPreview={onPreview}
      />
    </div>
  );
}
