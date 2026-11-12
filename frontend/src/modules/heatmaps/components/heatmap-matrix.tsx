import { Grid3x3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import type { HeatmapMatrixProps } from "../types/heatmap-component-props.types";
import { HeatmapCell } from "./heatmap-cell";
import { HeatmapExtraValue } from "./heatmap-extra-value";

const SKELETON_ROWS = 6;

export function HeatmapMatrix({ columns, rows, extraColumnsConfig, cellFormat, cellUnit, caption, isLoading = false, emptyMessage }: HeatmapMatrixProps) {
  const extras = extraColumnsConfig ?? [];
  const safeColumns = columns ?? [];
  const safeRows = rows ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4" aria-busy="true" aria-label="Cargando mapa de calor">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (safeRows.length === 0 || safeColumns.every((column) => (column.total ?? 0) === 0)) {
    return (
      <div role="status" className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-10 text-center">
        <Grid3x3 className="mb-2 size-9 stroke-[1.5] text-text-secondary/60" aria-hidden="true" />
        <p className="text-sm font-medium text-ink">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <Table className="border-separate border-spacing-1.5" aria-label={caption}>
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead scope="col" className="min-w-48 align-bottom text-xs font-semibold text-text-secondary">
              {HEATMAP_TEXT.rowHeader}
            </TableHead>
            {safeColumns.map((column) => (
              <TableHead key={column.id} scope="col" className="h-auto min-w-28 px-2 py-1 text-center align-bottom whitespace-normal">
                <span className="block text-xs leading-tight font-semibold text-ink">{column.label}</span>
                {column.sublabel && <span className="block text-xs leading-tight font-normal text-text-secondary">{column.sublabel}</span>}
              </TableHead>
            ))}
            {extras.map((extra) => (
              <TableHead key={extra.id} scope="col" className="h-auto min-w-28 border-l border-border px-2 py-1 text-center align-bottom whitespace-normal">
                <span className="block text-xs leading-tight font-semibold text-ink">{extra.label}</span>
                {extra.sublabel && <span className="block text-xs leading-tight font-normal text-text-secondary">{extra.sublabel}</span>}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeRows.map((row) => (
            <TableRow key={row.skillId} className="border-0 hover:bg-transparent">
              <TableHead scope="row" className="h-auto px-2 text-sm font-medium whitespace-normal text-ink">
                {row.skillName}
              </TableHead>
              {safeColumns.map((column) => (
                <TableCell key={column.id} className="p-0">
                  <HeatmapCell
                    cell={(row.cells ?? []).find((cell) => cell.columnId === column.id)}
                    column={column}
                    skillName={row.skillName}
                    cellFormat={cellFormat}
                    cellUnit={cellUnit}
                  />
                </TableCell>
              ))}
              {extras.map((extra) => (
                <TableCell key={extra.id} className="border-l border-border px-2 py-1 text-center">
                  <HeatmapExtraValue value={row.extraValues?.[extra.id]} config={extra} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
