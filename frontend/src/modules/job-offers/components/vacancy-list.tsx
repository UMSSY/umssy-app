"use client";

import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HISTORY_SKELETON_ROWS,
  NEW_JOB_OFFER_ROUTE,
  VACANCY_LIST_TEXT,
} from "../constants/vacancies.constants";
import { useCompanyJobOffers } from "../hooks/use-company-job-offers";
import type { JobOffer, JobOfferListScope } from "../types/job-offer.types";
import { DEFAULT_JOB_OFFER_FILTERS, type JobOfferFilters } from "../utils/filter-job-offers";
import { JobOfferDetailsDialog } from "./job-offer-details-dialog";
import { VacancyCard } from "./vacancy-card";
import { VacancyFiltersDialog } from "./vacancy-filters-dialog";
import { DeleteVacancyModal } from "@/modules/vacancies/components/delete-vacancy-modal";
import { deleteVacancy } from "@/modules/vacancies/services/vacancies.service";

interface VacancyListProps {
  scope?: JobOfferListScope;
  onReopen?: (jobOfferId: string) => void;
}

export function VacancyList({ scope = "published", onReopen }: VacancyListProps) {
  const isHistory = scope === "history";
  const text = VACANCY_LIST_TEXT[scope];
  const [filters, setFilters] = useState<JobOfferFilters>(DEFAULT_JOB_OFFER_FILTERS);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  
  const [selectedOfferToDelete, setSelectedOfferToDelete] = useState<JobOffer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { companyId, offers, status, reload } = useCompanyJobOffers(filters, scope);

  const hasSearch = filters.search !== "";
  const hasOtherFilters =
    filters.modality !== "" ||
    filters.contractType !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    (isHistory && filters.status !== "");
  const hasFilters = hasSearch || hasOtherFilters;

  const update = <K extends keyof JobOfferFilters>(key: K, value: JobOfferFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const reset = () =>
    setFilters((current) => ({ ...DEFAULT_JOB_OFFER_FILTERS, search: current.search }));

  const handleOpenDeleteModal = (offer: JobOffer) => {
    setSelectedOfferToDelete(offer);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setSelectedOfferToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOfferToDelete) return;

    setIsDeleting(true);
    try {
      await deleteVacancy(selectedOfferToDelete.company.id, selectedOfferToDelete.id);

      toast.success("Vacante eliminada exitosamente", {
        position: "top-center",
        duration: 5000,
      });

      handleCloseDeleteModal();
      
      reload();
    } catch {
      toast.error("Ocurrió un error al intentar eliminar la vacante", {
        position: "top-center",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === "loading") {
    if (isHistory) {
      return (
        <div role="status" aria-label={text.loading} className="space-y-4">
          {Array.from({ length: HISTORY_SKELETON_ROWS }, (_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-border bg-surface p-5"
            >
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-sm text-text-secondary">{text.loading}</p>;
  }

  if (status === "error") {
    return (
      <div role="alert" className="flex items-center gap-2 text-sm text-text-secondary">
        {text.loadError}
        <Button type="button" variant="outline" size="sm" onClick={reload}>
          Reintentar
        </Button>
      </div>
    );
  }

  const emptyMessage = !hasFilters
    ? text.empty
    : hasSearch && !hasOtherFilters
      ? text.noSearchMatches
      : text.noMatches;

  return (
    <section aria-label={text.ariaLabel} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Input
          type="search"
          placeholder="Buscar por título de vacante..."
          aria-label="Buscar por título de vacante"
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          className="w-full max-md:h-11 sm:max-w-sm"
        />
        <VacancyFiltersDialog
          filters={filters}
          onChange={update}
          onReset={reset}
          showStatusFilter={isHistory}
        />
        {isHistory ? (
          <Link href={NEW_JOB_OFFER_ROUTE} className={cn(buttonVariants({ variant: "outline" }), "max-md:min-h-11")}>
            <Plus aria-hidden="true" />
            Crear nueva vacante
          </Link>
        ) : null}
      </div>

      {offers.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">{emptyMessage}</p>
          {isHistory && !hasFilters ? (
            <Link href={NEW_JOB_OFFER_ROUTE} className={cn(buttonVariants(), "max-md:min-h-11")}>
              <Plus aria-hidden="true" />
              Crear nueva vacante
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-4">
          {offers.map((offer) => (
            <VacancyCard
              key={offer.id}
              offer={offer}
              onDetails={setSelectedOfferId}
              showStatus={isHistory}
              onReopen={onReopen}
              onDelete={handleOpenDeleteModal}
            />
          ))}
        </ul>
      )}

      {companyId && selectedOfferId ? (
        <JobOfferDetailsDialog
          companyId={companyId}
          jobOfferId={selectedOfferId}
          onClose={() => setSelectedOfferId(null)}
        />
      ) : null}

      <DeleteVacancyModal
        isOpen={Boolean(selectedOfferToDelete)}
        vacancyTitle={selectedOfferToDelete?.title || null}
        isDeleting={isDeleting}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}