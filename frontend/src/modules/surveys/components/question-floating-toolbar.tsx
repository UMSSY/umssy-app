"use client";

import { CirclePlus, Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SURVEY_ARIA } from "../constants/survey-builder.constants";
import type { QuestionFloatingToolbarProps } from "../types/survey-component-props.types";

export function QuestionFloatingToolbar({ onAddQuestion, onDuplicate, onPreview }: QuestionFloatingToolbarProps) {
  const actions = [
    { label: SURVEY_ARIA.addQuestion, icon: CirclePlus, onClick: onAddQuestion, isPrimary: true },
    { label: SURVEY_ARIA.duplicate, icon: Copy, onClick: onDuplicate, isPrimary: false },
    { label: SURVEY_ARIA.preview, icon: Eye, onClick: onPreview, isPrimary: false },
  ];

  return (
    <div
      role="toolbar"
      aria-label={SURVEY_ARIA.toolbar}
      className="mt-2 ml-auto flex w-fit gap-1 rounded-lg border border-border bg-surface p-1 shadow-md xl:absolute xl:top-0 xl:-right-16 xl:mt-0 xl:flex-col"
    >
      {actions.map(({ label, icon: Icon, onClick, isPrimary }) => (
        <Tooltip key={label}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={label}
                onClick={onClick}
                className={isPrimary ? "rounded-full text-accent" : "rounded-full text-ink-soft"}
              />
            }
          >
            <Icon aria-hidden="true" className="size-5" />
          </TooltipTrigger>
          <TooltipContent side="left">{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
