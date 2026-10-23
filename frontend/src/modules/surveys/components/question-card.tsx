"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { SURVEY_ARIA, SURVEY_LIMITS, SURVEY_TEXT } from "../constants/survey-builder.constants";
import type { QuestionCardProps } from "../types/survey-component-props.types";
import { FieldErrorMessage } from "./field-error-message";
import { OptionMarker } from "./option-marker";
import { QuestionFloatingToolbar } from "./question-floating-toolbar";
import { QuestionOptionRow } from "./question-option-row";
import { QuestionSummary } from "./question-summary";
import { QuestionTypeSelect } from "./question-type-select";

export function QuestionCard({
  question,
  index,
  isActive,
  isDragging,
  isDropTarget,
  shouldFocusStatement,
  focusOptionId,
  errors,
  canMoveUp,
  canMoveDown,
  onActivate,
  onStatementChange,
  onTypeChange,
  onToggleRequired,
  onAddOption,
  onRemoveOption,
  onOptionChange,
  onDuplicate,
  onRemove,
  onAddQuestionAfter,
  onPreview,
  onMove,
  onFocusHandled,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}: QuestionCardProps) {
  const statementRef = useRef<HTMLInputElement>(null);
  const [isHandleArmed, setIsHandleArmed] = useState(false);
  const position = index + 1;
  const baseId = `question-${question.id}`;
  const statementError = errors[`questions.${index}.statement`];
  const optionsError = errors[`questions.${index}.options`];
  const isInvalid = Boolean(statementError || optionsError);
  const options = question.options ?? [];
  const canRemoveOptions = options.length > SURVEY_LIMITS.minOptions;

  useEffect(() => {
    if (!isActive || !shouldFocusStatement) return;
    statementRef.current?.focus();
    onFocusHandled();
  }, [isActive, shouldFocusStatement, onFocusHandled]);

  const handleHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowUp" && canMoveUp) {
      event.preventDefault();
      onMove(index, index - 1);
    } else if (event.key === "ArrowDown" && canMoveDown) {
      event.preventDefault();
      onMove(index, index + 1);
    }
  };

  const handleSummaryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onActivate(question.id);
  };

  return (
    <div
      id={baseId}
      data-testid={`question-card-${position}`}
      className={cn("relative scroll-mt-40", isDragging && "opacity-50")}
      draggable={isHandleArmed}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", question.id);
        onDragStart(index);
      }}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(index);
      }}
      onDragEnd={() => {
        setIsHandleArmed(false);
        onDragEnd();
      }}
    >
      <Card
        data-active={isActive ? "true" : undefined}
        data-invalid={isInvalid ? "true" : undefined}
        className={cn(
          "relative gap-0 px-6 pt-6 pb-4",
          isActive && "border-l-6 border-l-accent shadow-md",
          isInvalid && "border-l-6 border-danger border-l-danger",
          isDropTarget && !isDragging && "ring-2 ring-accent/30",
        )}
      >
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={SURVEY_ARIA.dragHandle(position)}
          aria-keyshortcuts="ArrowUp ArrowDown"
          onPointerDown={() => setIsHandleArmed(true)}
          onPointerUp={() => setIsHandleArmed(false)}
          onKeyDown={handleHandleKeyDown}
          className="absolute top-1 left-1/2 -translate-x-1/2 cursor-grab text-border-strong hover:text-ink-soft active:cursor-grabbing"
        >
          <GripVertical aria-hidden="true" className="rotate-90" />
        </Button>

        {isActive ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-start">
              <div className="min-w-0">
                <Label htmlFor={`${baseId}-statement`} className="sr-only">
                  {SURVEY_ARIA.statement(position)}
                </Label>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-t-md border-b-2 border-accent bg-surface-soft px-3",
                    statementError && "border-danger",
                  )}
                >
                  <span aria-hidden="true" className="text-sm font-medium text-ink">
                    {position}.
                  </span>
                  <Input
                    ref={statementRef}
                    id={`${baseId}-statement`}
                    value={question.statement}
                    maxLength={SURVEY_LIMITS.statementMax}
                    placeholder={SURVEY_TEXT.untitledQuestion}
                    aria-required="true"
                    aria-invalid={statementError ? true : undefined}
                    aria-describedby={statementError ? `${baseId}-statement-error` : undefined}
                    onChange={(event) => onStatementChange(question.id, event.target.value)}
                    className="h-11 flex-1 rounded-none border-0 bg-transparent px-0 text-sm font-medium text-ink shadow-none focus-visible:ring-0 aria-invalid:ring-0 md:text-sm dark:bg-transparent"
                  />
                </div>
                <FieldErrorMessage id={`${baseId}-statement-error`} message={statementError} />
              </div>
              <QuestionTypeSelect
                id={`${baseId}-type`}
                value={question.type}
                onChange={(questionType) => onTypeChange(question.id, questionType)}
              />
            </div>

            <div className="mt-3 flex flex-col">
              {options.map((option, optionIndex) => (
                <QuestionOptionRow
                  key={option.id}
                  option={option}
                  index={optionIndex}
                  questionType={question.type}
                  canRemove={canRemoveOptions}
                  shouldFocus={focusOptionId === option.id}
                  isInvalid={Boolean(optionsError)}
                  onChange={(label) => onOptionChange(question.id, option.id, label)}
                  onRemove={() => onRemoveOption(question.id, option.id)}
                  onFocusHandled={onFocusHandled}
                />
              ))}
              <div className="flex h-10 items-center gap-3">
                <OptionMarker questionType={question.type} />
                <Button
                  variant="link"
                  onClick={() => onAddOption(question.id)}
                  className="h-auto px-0 font-medium text-accent"
                >
                  {SURVEY_TEXT.addOption}
                </Button>
              </div>
              <FieldErrorMessage id={`${baseId}-options-error`} message={optionsError} />
            </div>

            <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3 text-ink-soft">
              <Button
                variant="ghost"
                size="icon"
                aria-label={SURVEY_ARIA.duplicate}
                onClick={() => onDuplicate(question.id)}
                className="rounded-full"
              >
                <Copy aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={SURVEY_ARIA.remove}
                onClick={() => onRemove(question.id)}
                className="rounded-full"
              >
                <Trash2 aria-hidden="true" />
              </Button>
              <Separator orientation="vertical" className="mx-2 h-6 data-vertical:self-center" />
              <Label htmlFor={`${baseId}-required`} className="cursor-pointer font-normal text-ink">
                {SURVEY_TEXT.required}
              </Label>
              <Switch
                id={`${baseId}-required`}
                checked={question.isRequired}
                onCheckedChange={() => onToggleRequired(question.id)}
                className="ml-2"
              />
            </div>
          </>
        ) : (
          <div
            role="button"
            tabIndex={0}
            aria-label={SURVEY_ARIA.editQuestion(position)}
            onClick={() => onActivate(question.id)}
            onKeyDown={handleSummaryKeyDown}
            className="cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            <QuestionSummary question={question} index={index} />
            <FieldErrorMessage id={`${baseId}-statement-error`} message={statementError} />
            <FieldErrorMessage id={`${baseId}-options-error`} message={optionsError} />
          </div>
        )}
      </Card>

      {isActive && (
        <QuestionFloatingToolbar
          onAddQuestion={() => onAddQuestionAfter(index)}
          onDuplicate={() => onDuplicate(question.id)}
          onPreview={onPreview}
        />
      )}
    </div>
  );
}
