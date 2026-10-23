"use client";

import { PageHeading } from "@/shared/components/layout/page-heading";
import { useState } from "react";

import { ReviewProfileDetail } from "../components/review-profile-detail";
import { ReviewProfileList } from "../components/review-profile-list";
import { ReviewQueueFilters } from "../components/review-queue-filters";
import { REVIEW_PROFILES } from "../data/review-queue.data";
import type {
  ReviewAction,
  ReviewProfile,
  ReviewQueueFilter,
} from "../types/review-queue.types";

export function ReviewQueueView() {
  const [activeFilter, setActiveFilter] =
    useState<ReviewQueueFilter>("Todos");

  const [selectedProfile, setSelectedProfile] =
    useState<ReviewProfile | null>(null);

  const [localAction, setLocalAction] =
    useState<ReviewAction | null>(null);

  const filteredProfiles =
    activeFilter === "Todos"
      ? REVIEW_PROFILES
      : REVIEW_PROFILES.filter(
          (profile) => profile.estado === activeFilter,
        );

  function handleFilterChange(filter: ReviewQueueFilter) {
    setActiveFilter(filter);
    setLocalAction(null);

    if (
      selectedProfile &&
      filter !== "Todos" &&
      selectedProfile.estado !== filter
    ) {
      setSelectedProfile(null);
    }
  }

  function handleProfileSelect(profile: ReviewProfile) {
    setSelectedProfile(profile);
    setLocalAction(null);
  }

  return (
    <main className="bg-background">
      <div className="@container/review mx-auto w-full max-w-7xl">
        <PageHeading className="mb-6" title="Revisión de radares" description="Selecciona un perfil para revisar sus competencias. Los datos y acciones de esta vista son de demostración." />

        <div className="grid min-h-96 grid-cols-1 items-start overflow-hidden rounded-lg border border-border bg-surface @4xl/review:grid-cols-[20rem_minmax(0,1fr)]">
          <section className="border-b border-border @4xl/review:border-r @4xl/review:border-b-0">
            <div className="border-b border-border p-5">
              <h2 className="font-semibold text-ink">
                Perfiles enviados
              </h2>

              <p className="mt-1 text-sm text-text-secondary">
                Revisa los perfiles enviados para generar su radar de afinidad.
              </p>

              <ReviewQueueFilters
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
              />
            </div>

            <ReviewProfileList
              profiles={filteredProfiles}
              selectedProfileId={selectedProfile?.id ?? null}
              onProfileSelect={handleProfileSelect}
            />
          </section>

          <div className="min-w-0"><ReviewProfileDetail
            profile={selectedProfile}
            localAction={localAction}
            onAction={setLocalAction}
          /></div>
        </div>
      </div>
    </main>
  );
}
