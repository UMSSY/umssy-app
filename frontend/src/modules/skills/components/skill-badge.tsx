import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SkillBadgeProps } from "../types/skill-badge-props.types";
import { getSkillOriginHint } from "../utils/get-skill-origin-hint";

export function SkillBadge({ skill, onRemove, disabled = false }: SkillBadgeProps) {
  const canRemove = skill.isRemovable !== false;
  const originHint = getSkillOriginHint(skill);

  return (
    <span
      data-removable={canRemove}
      title={originHint}
      className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-1.5 text-sm font-semibold text-ink"
    >
      <span title={skill.name} className="min-w-0 truncate">
        {skill.name}
      </span>
      {originHint ? <span className="sr-only">{originHint}</span> : null}
      {canRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          onClick={() => onRemove(skill.id)}
          aria-label={`Quitar ${skill.name}`}
          className="-my-1 -mr-2 size-8 shrink-0 text-text-secondary hover:bg-transparent hover:text-accent disabled:opacity-50 sm:-my-0 sm:-mr-0 sm:size-5"
        >
          <X aria-hidden="true" className="size-3.5" />
        </Button>
      ) : null}
    </span>
  );
}
