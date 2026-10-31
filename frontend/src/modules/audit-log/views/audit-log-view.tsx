"use client";

import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { EvidenceViewerDialog } from "../components/evidence/evidence-viewer-dialog";
import { ExportCsvButton } from "../components/export/export-csv-button";
import { AuditFilters } from "../components/filters/audit-filters";
import { AuditReadOnlyNotice } from "../components/layout/audit-read-only-notice";
import { AuditEventCards } from "../components/list/audit-event-cards";
import { AuditEventTable } from "../components/list/audit-event-table";
import { AuditLogStatus } from "../components/list/audit-log-status";
import { AuditPagination } from "../components/list/audit-pagination";
import { AUDIT_PAGE_DESCRIPTION, AUDIT_PAGE_TITLE } from "../constants/audit-log.constants";
import { useAuditCsvExport } from "../hooks/use-audit-csv-export";
import { useAuditEvents } from "../hooks/use-audit-events";
import { useAuditFilters } from "../hooks/use-audit-filters";
import { useAuditResponsibles } from "../hooks/use-audit-responsibles";
import { useEvidenceViewer } from "../hooks/use-evidence-viewer";

export function AuditLogView() {
  const auditFilters = useAuditFilters();
  const responsibles = useAuditResponsibles();
  const list = useAuditEvents(auditFilters.filters);
  const evidence = useEvidenceViewer();
  const csv = useAuditCsvExport();

  const isEmpty = !list.isLoading && !list.error && list.items.length === 0;
  const listProps = {
    items: list.items,
    isLoading: list.isLoading,
    loadingEvidenceId: evidence.loadingId,
    onOpenEvidence: evidence.open,
  };

  return (
    <WorkspacePage
      title={AUDIT_PAGE_TITLE}
      description={AUDIT_PAGE_DESCRIPTION}
      className="min-w-0 [contain:inline-size]"
      actions={
        <ExportCsvButton
          total={list.total}
          isExporting={csv.isExporting}
          disabled={list.isLoading || Boolean(list.error) || list.total === 0}
          onExport={() => void csv.exportCsv(auditFilters.filters)}
        />
      }
    >
      <AuditReadOnlyNotice />

      <AuditFilters
        values={auditFilters.values}
        responsibles={responsibles}
        activeCount={auditFilters.activeCount}
        periodError={auditFilters.periodError}
        {...auditFilters.handlers}
      />

      {!list.isLoading && !list.error ? (
        <p className="flex flex-wrap justify-between gap-2 text-[13px] text-text-secondary" aria-live="polite">
          <span>{list.total} eventos en el período seleccionado</span>
          {list.total > 0 ? <span>Exportar CSV descarga los {list.total} eventos filtrados, no solo esta página.</span> : null}
        </p>
      ) : null}

      <div className="w-full min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
        {list.error || isEmpty ? (
          <AuditLogStatus
            error={list.error}
            errorStatus={list.errorStatus}
            isEmpty={isEmpty}
            hasActiveFilters={auditFilters.hasActiveFilters}
            onRetry={list.retry}
            onClearFilters={auditFilters.handlers.onClear}
          />
        ) : (
          <>
            <div className="hidden md:block">
              <AuditEventTable {...listProps} />
            </div>
            <div className="bg-surface-soft p-3 md:hidden">
              <AuditEventCards {...listProps} />
            </div>
            {!list.isLoading && (
              <AuditPagination
                from={list.from}
                to={list.to}
                total={list.total}
                page={list.page}
                totalPages={list.totalPages}
                hasPrevious={list.hasPrevious}
                hasNext={list.hasNext}
                onPrevious={list.goToPrevious}
                onNext={list.goToNext}
                onPageChange={list.goToPage}
              />
            )}
          </>
        )}
      </div>

      <EvidenceViewerDialog event={evidence.opened?.event ?? null} url={evidence.opened?.url ?? null} finalFocus={evidence.triggerRef} onClose={evidence.close} />
    </WorkspacePage>
  );
}
