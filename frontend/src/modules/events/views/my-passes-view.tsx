"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { OFFLINE_PASSES_TEXTS } from "../constants/offline-passes.constants";
import { usePassesViewState } from "../hooks/use-passes-view-state";
import { OfflineStatusBanner } from "../components/offline-status-banner";
import { NoOfflineCopyState } from "../components/no-offline-copy-state";
import { RequestFeedback } from "../components/request-feedback";
import { PassCard } from "../components/pass-card";
import { PassDetail } from "../components/pass-detail";
import { MyPassesEmptyState } from "../components/my-passes-empty-state";

import type { MyPassesViewProps } from "../types/my-passes-view-props.types";

export function MyPassesView({ onOpenWorkshopChat }: MyPassesViewProps = {}) {
  const { status, isOnline, passes: registrations, offlineQrTokens, lastUpdated, isStale, error, retry } = usePassesViewState();
  const isLoading = status === "loading";
  const offlineReason = isOnline ? undefined : OFFLINE_PASSES_TEXTS.requiresConnection;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = registrations.find((item) => item.id === selectedId) ?? registrations[0];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeading
        title="Mis inscripciones"
        description={isLoading ? "Cargando tus inscripciones…" : `${registrations.length} ${registrations.length === 1 ? "pase" : "pases"}`}
        actions={offlineReason
          ? <Button variant="outline" disabled title={offlineReason}><CalendarDays aria-hidden="true" />Explorar talleres</Button>
          : <Link href="/events" className={buttonVariants({ variant: "outline" })}><CalendarDays aria-hidden="true" />Explorar talleres</Link>}
      />
      {status === "saved" ? <OfflineStatusBanner isOnline={isOnline} lastUpdated={lastUpdated} isStale={isStale} onRetry={retry} /> : null}
      {isLoading ? (
        <RequestFeedback message="Cargando tus inscripciones..." />
      ) : status === "no-offline-copy" ? (
        <NoOfflineCopyState />
      ) : status === "error" && error ? (
        <RequestFeedback message={error} isError onRetry={retry} />
      ) : !registrations.length ? (
        <MyPassesEmptyState />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <section aria-label="Tus inscripciones">
            <ul className="space-y-3">
              {registrations.map((item) => (
                <li key={item.id}>
                  <PassCard
                    title={item.eventName}
                    date={item.date}
                    startTime={item.startTime}
                    endTime={item.endTime}
                    status={item.status}
                    location={item.location}
                    registrationId={item.id}
                    onOpenChat={onOpenWorkshopChat}
                    chatDisabledReason={offlineReason}
                    isAvailableOffline={status === "live" && item.id in offlineQrTokens}
                    isSelected={selected?.id === item.id}
                    onClick={() => setSelectedId(item.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
          {selected ? (
            <aside aria-label="Detalle de la inscripción" className="sticky top-24 min-w-0">
              <PassDetail registration={selected} offlineQrToken={status === "saved" ? offlineQrTokens[selected.id] : undefined} />
            </aside>
          ) : null}
        </div>
      )}
    </main>
  );
}
