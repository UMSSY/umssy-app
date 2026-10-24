import { cn } from "@/lib/utils";
import type { RadarCardProps } from "../types/radar-profile-components.types";

export function RadarCard({ as: Tag = "section", className, children, ...props }: RadarCardProps) {
  return (
    <Tag
      className={cn(
        "min-w-0 rounded-lg border border-border bg-surface font-sans text-sm text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
