"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  companyAccessRequestService,
  type CompanyAccessRequestItem,
  type CompanyRequestsSummary,
} from "@/modules/access-requests";
import { CompanyRequestTable } from "../components/company/company-request-table";
import { COMPANY_STATUS_TABS } from "../constants/company-request.constants";

export function CompanyRequestInboxView() {
  const [rows, setRows] = useState<CompanyAccessRequestItem[]>([]);
  const [summary, setSummary] = useState<CompanyRequestsSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([
      companyAccessRequestService.list({
        status: statusFilter,
        search: search || undefined,
      }),
      companyAccessRequestService.getSummary(),
    ])
      .then(([listRes, summaryRes]) => {
        if (!active) return;
        if (listRes.ok) setRows(listRes.data.rows);
        if (summaryRes.ok) setSummary(summaryRes.data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [statusFilter, search]);

  const pendingOnlyCount = Math.max(
    0,
    (summary?.pendingCount ?? 0) - (summary?.inReviewCount ?? 0),
  );

  const tabCounts: Record<string, number> = {
    PENDING: pendingOnlyCount,
    IN_REVIEW: summary?.inReviewCount ?? 0,
    APPROVED: summary?.approvedCount ?? 0,
    REJECTED: summary?.rejectedCount ?? 0,
  };

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0">
      <header className="mb-6 border-b border-border pb-5">
        <h1 className="text-3xl font-bold text-primary">
          Solicitudes de empresas
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Revisa la carta membretada y los datos institucionales de cada empresa
          antes de emitir tu dictamen.
        </p>
      </header>

      <section className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Requieren revisión manual
            </p>
            <p className="mt-2 text-3xl font-bold text-ink">
              {summary?.pendingCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {pendingOnlyCount} sin abrir aún
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              En revisión activa
            </p>
            <p className="mt-2 text-3xl font-bold text-ink">
              {summary?.inReviewCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              abiertas por administración
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Empresas aprobadas
            </p>
            <p className="mt-2 text-3xl font-bold text-ink">
              {summary?.approvedCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              habilitadas para reclutar
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Rechazadas
            </p>
            <p className="mt-2 text-3xl font-bold text-ink">
              {summary?.rejectedCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              documentación observada
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 pt-2">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {COMPANY_STATUS_TABS.map((tab) => {
                const active = statusFilter === tab.value;
                return (
                  <Button
                    key={tab.value}
                    type="button"
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setLoading(true);
                      setStatusFilter(tab.value);
                    }}
                    className="gap-2 font-semibold"
                  >
                    <span>{tab.label}</span>
                    <span className="rounded-full bg-surface-soft px-2 py-0.5 text-xs font-semibold text-text-secondary">
                      {tabCounts[tab.value] ?? 0}
                    </span>
                  </Button>
                );
              })}
            </div>

            <div className="relative mb-2 w-full sm:w-72">
              <Search
                aria-hidden="true"
                className="absolute top-2.5 left-3 size-4 text-text-secondary"
              />
              <Input
                placeholder="Empresa, código o correo..."
                value={search}
                onChange={(e) => {
                  setLoading(true);
                  setSearch(e.target.value);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {!loading && rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-text-secondary">
              No hay solicitudes de empresas en este estado.
            </div>
          ) : (
            <CompanyRequestTable items={rows} isLoading={loading} />
          )}
        </div>
      </section>
    </main>
  );
}
