"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SelectedSkillChipProps } from "../types/selected-skill-chip-props.types";

export function SelectedSkillChip({ skill, onRemove }: SelectedSkillChipProps) {
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm font-semibold text-ink">
      <span title={skill.name} className="min-w-0 truncate">
        {skill.name}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onRemove(skill)}
        aria-label={`Quitar ${skill.name}`}
        className="-my-1 size-7 shrink-0 text-text-secondary hover:bg-transparent hover:text-accent sm:my-0 sm:size-5"
      >
        <X aria-hidden="true" className="size-3.5" />
      </Button>
    </span>
  );
}
