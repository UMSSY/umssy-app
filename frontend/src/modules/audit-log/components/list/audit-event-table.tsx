"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_PAGE_SIZE, EMPTY_VALUE } from "../../constants/audit-log.constants";
import type { AuditEventListProps } from "../../types/audit-log-component-props.types";
import { EvidenceButton } from "../evidence/evidence-button";
import { AuditActionBadge } from "./audit-action-badge";
import { AuditEventDate } from "./audit-event-date";
import { AuditResponsibleCell } from "./audit-responsible-cell";

const CELL_CLASS = "text-sm text-ink";
const COLUMNS = ["Fecha y hora", "Solicitud", "Acción", "Responsable", "Detalle", "Evidencia"];

// Tabla de solo lectura: no hay controles para editar ni borrar eventos
export function AuditEventTable({ items, isLoading = false, loadingEvidenceId, onOpenEvidence }: AuditEventListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {COLUMNS.map((column) => (
            <TableHead key={column}>
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: AUDIT_PAGE_SIZE / 2 }, (_, index) => (
              <TableRow key={index} data-testid="audit-skeleton-row" className="h-16 border-border">
                {COLUMNS.map((column) => (
                  <TableCell key={column} className={CELL_CLASS}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : items.map((event) => (
              <TableRow key={event.id} className="border-border">
                <TableCell className={CELL_CLASS}>
                  <AuditEventDate occurredAt={event.occurredAt} />
                </TableCell>
                <TableCell className={CELL_CLASS}>
                  <span className="font-bold text-ink">{event.request.code || EMPTY_VALUE}</span>
                </TableCell>
                <TableCell className={CELL_CLASS}>
                  <AuditActionBadge action={event.action} />
                </TableCell>
                <TableCell className={`${CELL_CLASS} min-w-48 whitespace-normal`}>
                  <AuditResponsibleCell responsible={event.responsible} />
                </TableCell>
                <TableCell className={`${CELL_CLASS} min-w-56 whitespace-normal`}>{event.detail || EMPTY_VALUE}</TableCell>
                <TableCell className={CELL_CLASS}>
                  <EvidenceButton event={event} isLoading={loadingEvidenceId === event.id} onOpen={onOpenEvidence} />
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
