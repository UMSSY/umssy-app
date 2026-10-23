"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompanyJobOffers } from "../hooks/use-company-job-offers";
import { DEFAULT_JOB_OFFER_FILTERS, type JobOfferFilters } from "../utils/filter-job-offers";
import { VacancyCard } from "./vacancy-card";
import { VacancyFiltersDialog } from "./vacancy-filters-dialog";

export function VacancyList() {
  const [filters, setFilters] = useState<JobOfferFilters>(DEFAULT_JOB_OFFER_FILTERS);
  const { offers, status, reload } = useCompanyJobOffers(filters);

  const hasFilters =
    filters.search !== "" ||
    filters.modality !== "" ||
    filters.contractType !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  const update = <K extends keyof JobOfferFilters>(key: K, value: JobOfferFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const reset = () =>
    setFilters((current) => ({ ...DEFAULT_JOB_OFFER_FILTERS, search: current.search }));

  if (status === "loading") {
    return <p className="text-sm text-text-secondary">Cargando vacantes...</p>;
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        No se pudieron cargar tus vacantes.
        <Button type="button" variant="outline" size="sm" onClick={reload}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <section aria-label="Mis vacantes publicadas" className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder="Buscar por título de vacante..."
          aria-label="Buscar por título de vacante"
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          className="max-w-sm"
        />
        <VacancyFiltersDialog filters={filters} onChange={update} onReset={reset} />
      </div>

      {offers.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {hasFilters
            ? "Ninguna vacante coincide con los filtros."
            : "Aún no has publicado vacantes."}
        </p>
      ) : (
        <ul className="space-y-4">
          {offers.map((offer) => (
            <VacancyCard key={offer.id} offer={offer} />
          ))}
        </ul>
      )}
    </section>
  );
}