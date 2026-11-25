"use client";

import Link from "next/link";
import { Building2, Clock, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "cn";
import { COMPANY_INBOX_STATUS_LABELS } from "../../constants/company-request.constants";
import type { CompanyRequestTableProps } from "../../types/company-request-table-props.types";

const HEAD_CLASS = "h-10 px-5 lg:px-4 text-[11.5px] font-semibold text-ink-soft";
const CELL_CLASS =
  "px-5 lg:px-4 text-sm text-ink max-md:block max-md:p-0 max-md:before:mb-0.5 max-md:before:block max-md:before:text-xs max-md:before:font-semibold max-md:before:text-text-secondary max-md:before:content-[attr(data-label)]";
const WRAP_CLASS = "whitespace-normal break-words";
const TABLE_COLUMN_COUNT = 7;
const SKELETON_ROWS = 4;

export function CompanyRequestTable({
  items,
  isLoading = false,
}: CompanyRequestTableProps) {
  return (
    <Table className="min-w-[960px] table-fixed max-md:block max-md:min-w-0">
      <TableHeader className="bg-surface-soft max-md:hidden">
        <TableRow className="hover:bg-transparent">
          <TableHead className={cn(HEAD_CLASS, "w-[26%]")}>Empresa</TableHead>
          <TableHead className={cn(HEAD_CLASS, "w-[12%]")}>Código</TableHead>
          <TableHead className={cn(HEAD_CLASS, "w-[17%]")}>Rubro</TableHead>
          <TableHead className={cn(HEAD_CLASS, "w-[14%]")}>Documento</TableHead>
          <TableHead className={cn(HEAD_CLASS, "w-[11%]")}>Estado</TableHead>
          <TableHead className={cn(HEAD_CLASS, "w-[11%]")}>Coincidencia</TableHead>
          <TableHead className={cn(HEAD_CLASS, "w-[9%] text-right")}>
            Acción
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="max-md:block">
        {isLoading
          ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <TableRow
                key={index}
                data-testid="company-request-skeleton-row"
                className="h-[60px] border-border max-md:block max-md:h-auto max-md:space-y-2 max-md:p-4"
              >
                {Array.from({ length: TABLE_COLUMN_COUNT }, (_, cell) => (
                  <TableCell key={cell} className={CELL_CLASS}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : items.map((item) => {
              const score = item.ocrMatchScore;
              return (
                <TableRow
                  key={item.id}
                  className="h-[60px] border-border max-md:grid max-md:h-auto max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3 max-md:p-4"
                >
                  <TableCell
                    className={cn(
                      CELL_CLASS,
                      WRAP_CLASS,
                      "max-md:col-span-2 max-md:before:hidden",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-soft text-primary"
                        aria-hidden="true"
                      >
                        <Building2 className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="font-semibold text-ink">
                          {item.companyName}
                        </span>
                        <span
                          className="truncate text-sm text-text-secondary"
                          title={item.email}
                        >
                          {item.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    data-label="Código"
                    className={cn(CELL_CLASS, "font-mono text-xs")}
                  >
                    {item.requestCode ?? "—"}
                  </TableCell>
                  <TableCell
                    data-label="Rubro"
                    className={cn(CELL_CLASS, WRAP_CLASS)}
                  >
                    <div className="flex flex-col">
                      <span>{item.sector}</span>
                      <span className="text-xs text-text-secondary">
                        {item.city.name ?? item.city.title ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    data-label="Documento"
                    className={cn(CELL_CLASS, WRAP_CLASS)}
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <FileText
                        className="size-4 shrink-0 text-text-secondary"
                        aria-hidden="true"
                      />
                      Carta membretada
                    </span>
                  </TableCell>
                  <TableCell
                    data-label="Estado"
                    className={cn(CELL_CLASS, WRAP_CLASS)}
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {COMPANY_INBOX_STATUS_LABELS[item.status.title] ??
                        "Pendiente"}
                    </span>
                  </TableCell>
                  <TableCell
                    data-label="Coincidencia"
                    className={cn(
                      CELL_CLASS,
                      "text-xs font-medium text-text-secondary",
                    )}
                  >
                    {typeof score === "number"
                      ? `${score}% coincidencia`
                      : "Sin validar"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      CELL_CLASS,
                      "text-right max-md:col-span-2 max-md:before:hidden",
                    )}
                  >
                    <Link
                      href={`/backoffice/empresas/${item.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-[34px] rounded-lg border-border bg-surface px-4 text-sm font-semibold text-ink max-md:h-10 max-md:w-full",
                      )}
                    >
                      Revisar
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
      </TableBody>
    </Table>
  );
}
