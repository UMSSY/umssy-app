"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SURVEY_ARIA, SURVEY_LIMITS, SURVEY_TEXT } from "../constants/survey-builder.constants";
import type { QuestionOptionRowProps } from "../types/survey-component-props.types";
import { OptionMarker } from "./option-marker";

export function QuestionOptionRow({
  option,
  index,
  questionType,
  canRemove,
  shouldFocus,
  isInvalid,
  onChange,
  onRemove,
  onFocusHandled,
}: QuestionOptionRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const position = index + 1;

  useEffect(() => {
    if (!shouldFocus) return;
    inputRef.current?.focus();
    onFocusHandled();
  }, [shouldFocus, onFocusHandled]);

  return (
    <div className="flex h-10 items-center gap-3">
      <OptionMarker questionType={questionType} />
      <Input
        ref={inputRef}
        value={option.label}
        maxLength={SURVEY_LIMITS.optionMax}
        placeholder={SURVEY_TEXT.optionPlaceholder(position)}
        aria-label={SURVEY_ARIA.option(position)}
        aria-invalid={isInvalid ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-9 flex-1 rounded-none border-0 border-b border-border bg-transparent px-0 text-sm text-ink shadow-none focus-visible:border-b-2 focus-visible:border-accent focus-visible:ring-0 aria-invalid:ring-0 md:text-sm dark:bg-transparent",
          isInvalid && "border-danger",
        )}
      />
      {canRemove ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={SURVEY_ARIA.removeOption(position)}
          onClick={onRemove}
          className="rounded-full text-text-secondary hover:text-ink"
        >
          <X aria-hidden="true" />
        </Button>
      ) : (
        <span aria-hidden="true" className="size-7 shrink-0" />
      )}
    </div>
  );
}
