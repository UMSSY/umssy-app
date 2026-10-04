"use client";

import { REQUEST_STATUS_TABS } from "../constants/request-review.constants";
import type { RequestsStatusTabsProps } from "../types/request-review-props.types";

export function RequestsStatusTabs({ activeStatus, onStatusChange }: RequestsStatusTabsProps) {
  return (
    <div role="tablist" aria-label="Estado de las solicitudes" className="flex gap-6 border-b border-[#E3E7EC] px-4">
      {REQUEST_STATUS_TABS.map(({ status, label }) => {
        const isActive = status === activeStatus;
        return (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onStatusChange(status)}
            className={
              isActive
                ? "-mb-px border-b-2 border-[#E30613] py-3 text-[13px] font-bold text-[#0B1F2E]"
                : "-mb-px border-b-2 border-transparent py-3 text-[13px] font-semibold text-[#5B6470] hover:text-[#0B1F2E]"
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}