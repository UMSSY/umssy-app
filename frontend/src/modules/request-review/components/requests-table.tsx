"use client";

import { formatRelativeTime } from "@/shared/utils/format-relative-time";
import {
  DOCUMENT_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
} from "../constants/request-review.constants";
import type { RequestsTableProps } from "../types/request-review-props.types";

const COLUMN_HEADERS = ["Solicitante", "Código SIS", "Documento", "Enviada", "Estado", "Acción"];

export function RequestsTable({ requests, onReview }: RequestsTableProps) {
  return (
    <table className="w-full border-collapse">
      <thead className="bg-[#F6F7F9]">
        <tr>
          {COLUMN_HEADERS.map((header) => (
            <th
              key={header}
              className="px-4 py-3 text-left text-[11.5px] font-semibold uppercase text-[#5B6470]"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {requests.map((request) => (
          <tr key={request.id} className="border-t border-[#E3E7EC]">
            <td className="px-4 py-3">
              <p className="text-[13px] font-semibold text-[#0B1F2E]">{request.fullName}</p>
              <p className="text-[12px] text-[#5B6470]">{request.email}</p>
            </td>
            <td className="px-4 py-3 text-[13px] text-[#33465A]">{request.sisCode}</td>
            <td className="px-4 py-3 text-[13px] text-[#33465A]">
              {DOCUMENT_TYPE_LABELS[request.documentType]}
            </td>
            <td className="px-4 py-3 text-[13px] text-[#33465A]">
              {formatRelativeTime(request.submittedAt)}
            </td>
            <td className="px-4 py-3 text-[13px] text-[#33465A]">
              {REQUEST_STATUS_LABELS[request.status]}
            </td>
            <td className="px-4 py-3">
              <button
                type="button"
                onClick={() => onReview(request.id)}
                className="rounded-[6px] border border-[#C9CFD8] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#0B1F2E] transition-colors hover:bg-[#F6F7F9]"
              >
                Revisar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}