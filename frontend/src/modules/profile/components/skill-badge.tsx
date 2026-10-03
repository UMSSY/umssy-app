import { X } from "lucide-react";
import { SkillItem } from "../types/skill-item.types";

interface SkillBadgeProps {
  skill: SkillItem;
  onRemove: (id: string) => void;
}

export function SkillBadge({ skill, onRemove }: SkillBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground border border-border">
      {skill.name}
      <button
        type="button"
        onClick={() => onRemove(skill.id)}
        className="text-muted-foreground hover:text-foreground focus:outline-none"
        aria-label={`Eliminar ${skill.name}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}