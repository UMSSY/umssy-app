import type { RequestsTableSkeletonProps } from "../types/request-review-props.types";

const DEFAULT_ROW_COUNT = 5;
const COLUMN_HEADERS = ["Solicitante", "Código SIS", "Documento", "Enviada", "Estado", "Acción"];

export function RequestsTableSkeleton({ rowCount = DEFAULT_ROW_COUNT }: RequestsTableSkeletonProps) {
  return (
    <table className="w-full border-collapse" aria-busy="true" aria-label="Cargando solicitudes">
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
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <tr key={rowIndex} className="border-t border-[#E3E7EC]">
            {COLUMN_HEADERS.map((header) => (
              <td key={header} className="px-4 py-4">
                <div className="h-4 w-full max-w-[140px] animate-pulse rounded-[6px] bg-[#E3E7EC]" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}