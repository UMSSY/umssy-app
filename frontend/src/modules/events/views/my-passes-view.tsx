"use client";

import { useState } from "react";
import { DEFAULT_REGISTRATION_ERROR_MESSAGE } from "@/modules/registrations";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { OFFLINE_PASSES_TEXTS } from "../constants/offline-passes.constants";
import { useEventFinished } from "../hooks/use-event-finished";
import { usePassesViewState } from "../hooks/use-passes-view-state";
import { OfflineStatusBanner } from "../components/offline-status-banner";
import { NoOfflineCopyState } from "../components/no-offline-copy-state";
import { RequestFeedback } from "../components/request-feedback";
import { PassCard } from "../components/pass-card";
import { PassDetail } from "../components/pass-detail";
import { MyPassesEmptyState } from "../components/my-passes-empty-state";

import type { MyPassesViewProps } from "../types/my-passes-view-props.types";

export function MyPassesView({ onOpenWorkshopChat }: MyPassesViewProps = {}) {
  const { status, isOnline, passes: registrations, offlineQrTokens, lastUpdated, error, isConnectionError, retry } = usePassesViewState();
  const finishedRegistrations = useEventFinished(
    registrations.map(({ date, endTime }) => ({
      eventDate: date,
      endTime,
    })),
  );
  const activeRegistrations = registrations.filter(
    (_, index) => !finishedRegistrations[index],
  );
  const isLoading = status === "loading";
  const offlineReason = isOnline ? undefined : OFFLINE_PASSES_TEXTS.requiresConnection;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    activeRegistrations.find((item) => item.id === selectedId) ??
    activeRegistrations[0];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeading
        title="Mis inscripciones"
        description={isLoading ? "Cargando tus inscripciones…" : `${activeRegistrations.length} ${activeRegistrations.length === 1 ? "pase" : "pases"}`}
        actions={offlineReason
          ? <Button variant="outline" disabled title={offlineReason}><CalendarDays aria-hidden="true" />Explorar talleres</Button>
          : <Link href="/events" className={buttonVariants({ variant: "outline" })}><CalendarDays aria-hidden="true" />Explorar talleres</Link>}
      />
      {status === "saved" ? <OfflineStatusBanner isOnline={isOnline} lastUpdated={lastUpdated} onRetry={retry} /> : null}
      {isLoading ? (
        <RequestFeedback message="Cargando tus inscripciones..." />
      ) : status === "no-offline-copy" || (status === "error" && error) ? (
        <div className="space-y-6">
          {status === "no-offline-copy" || isConnectionError ? <NoOfflineCopyState /> : null}
          <RequestFeedback message={error ?? DEFAULT_REGISTRATION_ERROR_MESSAGE} isError onRetry={retry} />
        </div>
      ) : !activeRegistrations.length ? (
        <MyPassesEmptyState />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <section aria-label="Tus inscripciones">
            <ul className="space-y-3">
              {activeRegistrations.map((item) => (
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
