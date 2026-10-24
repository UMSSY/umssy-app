import { TriangleAlert } from "lucide-react";
import type { DangerZoneProps } from "@/shared/types/danger-zone-props.types";

export function DangerZone({ title, description, children }: DangerZoneProps) {
  return (
    <section aria-label={title} className="rounded-lg border border-brand-red/30 bg-brand-red/5 p-5">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-danger">{title}</h3>
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-3">{children}</div>
    </section>
  );
}
