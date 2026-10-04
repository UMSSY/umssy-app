import { Inbox } from "lucide-react";
import type { RequestsEmptyStateProps } from "../types/request-review-props.types";

export function RequestsEmptyState({ statusLabel }: RequestsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <Inbox className="h-8 w-8 text-[#5B6470]" aria-hidden="true" />
      <p className="text-[15px] font-bold text-[#0B1F2E]">No hay solicitudes</p>
      <p className="text-[13px] text-[#5B6470]">
        No hay solicitudes en estado {statusLabel.toLowerCase()} por el momento.
      </p>
    </div>
  );
}