"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "cn";
import { getInitials } from "@/shared/utils/get-initials";
import { DOCUMENT_TYPE_LABELS, INBOX_PATH, REVIEW_PAGE_SIZE } from "../../constants/request-review.constants";
import { formatRelativeTime } from "../../utils/format-relative-time";
import { StatusBadge } from "../common/status-badge";
import type { RequestTableProps } from "../../types/request-table-props.types";

const HEAD_CLASS = "h-10 px-5 lg:px-4 text-[11.5px] font-semibold text-ink-soft";
const CELL_CLASS =
  "px-5 lg:px-4 text-sm text-ink max-md:block max-md:p-0 max-md:before:mb-0.5 max-md:before:block max-md:before:text-xs max-md:before:font-semibold max-md:before:text-text-secondary max-md:before:content-[attr(data-label)]";
const WRAP_CLASS = "whitespace-normal break-words";
const TABLE_COLUMN_COUNT = 7;
const COLUMN_WIDTHS = ["w-[26%]", "w-[11%]", "w-[17%]", "w-[15%]", "w-[10%]", "w-[11%]", "w-[10%]"] as const;

export function RequestTable({ items = [], isLoading = false }: RequestTableProps) {
  return (
    <Table className="min-w-[960px] table-fixed max-md:block max-md:min-w-0">
      <TableHeader className="bg-surface-soft max-md:hidden">
        <TableRow className="hover:bg-transparent">
          <TableHead className={cn(HEAD_CLASS, COLUMN_WIDTHS[0])}>Solicitante</TableHead>
          <TableHead className={cn(HEAD_CLASS, COLUMN_WIDTHS[1])}>Código SIS</TableHead>
          <TableHead className={cn(HEAD_CLASS, COLUMN_WIDTHS[2])}>Carrera</TableHead>
          <TableHead className={cn(HEAD_CLASS, COLUMN_WIDTHS[3])}>Documento</TableHead>
          <TableHead className={cn(HEAD_CLASS, COLUMN_WIDTHS[4])}>Enviada</TableHead>
          <TableHead className={cn(HEAD_CLASS, COLUMN_WIDTHS[5])}>Estado</TableHead>
          <TableHead className={cn(HEAD_CLASS, COLUMN_WIDTHS[6], "text-right")}>Acción</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="max-md:block">
        {isLoading
          ? Array.from({ length: REVIEW_PAGE_SIZE / 2 }, (_, index) => (
              <TableRow key={index} data-testid="request-skeleton-row" className="h-[60px] border-border max-md:block max-md:h-auto max-md:space-y-2 max-md:p-4">
                {Array.from({ length: TABLE_COLUMN_COUNT }, (_, cell) => (
                  <TableCell key={cell} className={CELL_CLASS}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : items.map((item) => (
              <TableRow key={item.id} className="h-[60px] border-border max-md:grid max-md:h-auto max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3 max-md:p-4">
                <TableCell className={cn(CELL_CLASS, WRAP_CLASS, "max-md:col-span-2 max-md:before:hidden")}>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-soft text-sm font-bold text-ink"
                      aria-hidden="true"
                    >
                      {getInitials(item.fullName)}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="font-semibold text-ink">{item.fullName}</span>
                      <span className="truncate text-sm text-text-secondary" title={item.email}>
                        {item.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell data-label="Código SIS" className={CELL_CLASS}>
                  {item.sisCode}
                </TableCell>
                <TableCell data-label="Carrera" className={cn(CELL_CLASS, WRAP_CLASS, "max-md:col-span-2 max-md:row-start-3")}>
                  {item.career}
                </TableCell>
                <TableCell data-label="Documento" className={cn(CELL_CLASS, WRAP_CLASS, "max-md:col-span-2")}>
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="size-4 shrink-0 text-text-secondary" strokeWidth={1.75} aria-hidden="true" />
                    {item.documentType ? (DOCUMENT_TYPE_LABELS[item.documentType] ?? item.documentType) : "Sin documento"}
                  </span>
                </TableCell>
                <TableCell data-label="Enviada" className={cn(CELL_CLASS, "text-text-secondary max-md:col-start-2 max-md:row-start-2")}>
                  {formatRelativeTime(item.submittedAt)}
                </TableCell>
                <TableCell data-label="Estado" className={cn(CELL_CLASS, "max-md:col-span-2")}>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className={cn(CELL_CLASS, "text-right max-md:col-span-2 max-md:before:hidden")}>
                  <Link
                    href={`${INBOX_PATH}/${item.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-[34px] rounded-lg border-border bg-surface px-4 text-sm font-semibold text-ink max-md:h-10 max-md:w-full",
                    )}
                  >
                    Revisar
                  </Link>
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
