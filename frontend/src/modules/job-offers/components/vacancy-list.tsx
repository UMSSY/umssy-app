"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DELETE_JOB_OFFER_TEXT,
  HISTORY_SKELETON_ROWS,
  JOB_OFFERS_PAGE_SIZE,
  NEW_JOB_OFFER_ROUTE,
  REOPEN_JOB_OFFER_TEXT,
  VACANCY_LIST_TEXT,
} from "../constants/job-offers.constants";
import { useCompanyJobOffers } from "../hooks/use-company-job-offers";
import { useDeleteJobOffer } from "../hooks/use-delete-job-offer";
import { useReopenJobOffer } from "../hooks/use-reopen-job-offer";
import type { JobOffer } from "../types/job-offer.types";
import type { JobOfferFilters } from "../types/job-offer-filters.types";
import type { VacancyListProps } from "../types/vacancy-list-props.types";
import { DEFAULT_JOB_OFFER_FILTERS } from "../utils/filter-job-offers";
import { ConfirmDialog } from "./confirm-dialog";
import { JobOfferDetailsDialog } from "./job-offer-details-dialog";
import { JobOffersPagination } from "./job-offers-pagination";
import { VacancyCard } from "./vacancy-card";
import { VacancyFiltersDialog } from "./vacancy-filters-dialog";

const CREATE_LINK_CLASSES = "max-md:min-h-11";

export function VacancyList({ scope = "published" }: VacancyListProps) {
  const isHistory = scope === "history";
  const text = VACANCY_LIST_TEXT[scope];
  const [filters, setFilters] = useState<JobOfferFilters>(DEFAULT_JOB_OFFER_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<JobOffer | null>(null);
  const [offerToReopen, setOfferToReopen] = useState<JobOffer | null>(null);

  const { companyId, offers, status, reload } = useCompanyJobOffers(filters, scope);
  const deletion = useDeleteJobOffer();
  const reopening = useReopenJobOffer();

  const hasSearch = filters.search.trim() !== "";
  const hasOtherFilters =
    filters.modality !== "" ||
    filters.contractType !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.applicants !== DEFAULT_JOB_OFFER_FILTERS.applicants ||
    (isHistory && filters.status !== "");
  const hasFilters = hasSearch || hasOtherFilters;

  const totalPages = Math.max(1, Math.ceil(offers.length / JOB_OFFERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageOffers = offers.slice(
    (currentPage - 1) * JOB_OFFERS_PAGE_SIZE,
    currentPage * JOB_OFFERS_PAGE_SIZE,
  );

  const update = <K extends keyof JobOfferFilters>(key: K, value: JobOfferFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const reset = () => {
    setFilters(DEFAULT_JOB_OFFER_FILTERS);
    setPage(1);
  };

  // Solo puede haber un diálogo abierto: evita que una acción del fondo abra otro encima.
  const isAnyDialogOpen =
    selectedOfferId !== null || offerToDelete !== null || offerToReopen !== null;

  const openDetails = (jobOfferId: string) => {
    if (!isAnyDialogOpen) setSelectedOfferId(jobOfferId);
  };

  const openDeleteDialog = (offer: JobOffer) => {
    if (!isAnyDialogOpen) setOfferToDelete(offer);
  };

  const closeDeleteDialog = () => {
    if (!deletion.isPending) setOfferToDelete(null);
  };

  const confirmDelete = () => {
    if (!offerToDelete || deletion.isPending) return;
    deletion.mutate(
      { companyId: offerToDelete.company.id, jobOfferId: offerToDelete.id },
      { onSuccess: () => setOfferToDelete(null) },
    );
  };

  const openReopenDialog = (jobOfferId: string) => {
    if (isAnyDialogOpen) return;
    setOfferToReopen(offers.find((offer) => offer.id === jobOfferId) ?? null);
  };

  const closeReopenDialog = () => {
    if (!reopening.isPending) setOfferToReopen(null);
  };

  const confirmReopen = () => {
    if (!offerToReopen || reopening.isPending) return;
    reopening.mutate(
      { companyId: offerToReopen.company.id, jobOfferId: offerToReopen.id },
      { onSuccess: () => setOfferToReopen(null) },
    );
  };

  if (status === "loading") {
    return (
      <div role="status" aria-label={text.loading} className="space-y-4">
        {Array.from({ length: HISTORY_SKELETON_ROWS }, (_, index) => (
          <div key={index} className="space-y-3 rounded-lg border border-border bg-surface p-5">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        {text.loadError}
        <Button type="button" variant="outline" size="sm" onClick={reload} className="max-md:min-h-11">
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
        <Link
          href={NEW_JOB_OFFER_ROUTE}
          className={cn(buttonVariants({ variant: "outline" }), CREATE_LINK_CLASSES)}
        >
          <Plus aria-hidden="true" />
          Crear nueva vacante
        </Link>
      </div>

      {offers.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">{emptyMessage}</p>
          {!hasFilters ? (
            <Link href={NEW_JOB_OFFER_ROUTE} className={cn(buttonVariants(), CREATE_LINK_CLASSES)}>
              <Plus aria-hidden="true" />
              Crear nueva vacante
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {pageOffers.map((offer) => (
              <VacancyCard
                key={offer.id}
                offer={offer}
                onDetails={openDetails}
                showStatus={isHistory}
                onReopen={isHistory ? openReopenDialog : undefined}
                onDelete={openDeleteDialog}
              />
            ))}
          </ul>
          <JobOffersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {companyId && selectedOfferId ? (
        <JobOfferDetailsDialog
          companyId={companyId}
          jobOfferId={selectedOfferId}
          onClose={() => setSelectedOfferId(null)}
        />
      ) : null}

      <ConfirmDialog
        isOpen={offerToDelete !== null}
        title={DELETE_JOB_OFFER_TEXT.title}
        description={
          <>
            <span className="font-semibold text-ink">{offerToDelete?.title}</span>{" "}
            {DELETE_JOB_OFFER_TEXT.description}
          </>
        }
        cancelLabel={DELETE_JOB_OFFER_TEXT.cancel}
        confirmLabel={DELETE_JOB_OFFER_TEXT.confirm}
        busyLabel={DELETE_JOB_OFFER_TEXT.busy}
        confirmVariant="destructive"
        isBusy={deletion.isPending}
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />

      <ConfirmDialog
        isOpen={offerToReopen !== null}
        title={REOPEN_JOB_OFFER_TEXT.title}
        description={
          <>
            <span className="font-semibold text-ink">{offerToReopen?.title}</span>{" "}
            {REOPEN_JOB_OFFER_TEXT.description}
          </>
        }
        cancelLabel={REOPEN_JOB_OFFER_TEXT.cancel}
        confirmLabel={REOPEN_JOB_OFFER_TEXT.confirm}
        busyLabel={REOPEN_JOB_OFFER_TEXT.busy}
        isBusy={reopening.isPending}
        onConfirm={confirmReopen}
        onCancel={closeReopenDialog}
      />
    </section>
  );
}
