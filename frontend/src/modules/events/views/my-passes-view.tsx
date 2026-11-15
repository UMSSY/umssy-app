"use client";

import { useState } from "react";
import { DEFAULT_REGISTRATION_ERROR_MESSAGE } from "@/modules/registrations";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button-variants";
import { OFFLINE_PASSES_TEXTS } from "../constants/offline-passes.constants";
import { usePassesViewState } from "../hooks/use-passes-view-state";
import { OfflineStatusBanner } from "../components/offline-status-banner";
import { NoOfflineCopyState } from "../components/no-offline-copy-state";
import { RequestFeedback } from "../components/request-feedback";
import { PassCard } from "../components/pass-card";
import { PassDetail } from "../components/pass-detail";
import { MyPassesEmptyState } from "../components/my-passes-empty-state";
import { FinishedRegistrationCard } from "../components/finished-registration-card";
import { useFinishedRegistrations } from "../hooks/use-finished-registrations";

import type { MyPassesViewProps } from "../types/my-passes-view-props.types";

export function MyPassesView({ onOpenWorkshopChat }: MyPassesViewProps = {}) {
  const { status, isOnline, passes: registrations, offlineQrTokens, lastUpdated, error, isConnectionError, retry } = usePassesViewState();
  const isLoading = status === "loading";
  const offlineReason = isOnline ? undefined : OFFLINE_PASSES_TEXTS.requiresConnection;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("current");
  const history = useFinishedRegistrations(activeTab === "history" && isOnline);
  const historyUnavailable = activeTab === "history" && !isOnline;
  const visibleCount = activeTab === "history" ? history.total : registrations.length;
  const showCount = activeTab === "history" ? !history.isLoading && (!history.error || history.registrations.length > 0) && !historyUnavailable : !isLoading && status !== "error" && status !== "no-offline-copy";
  const description = showCount ? `${visibleCount} ${visibleCount === 1 ? "pase" : "pases"}` : activeTab === "history" && (history.error || historyUnavailable) ? "" : "Cargando tus inscripciones…";

  const selected = registrations.find((item) => item.id === selectedId) ?? registrations[0];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <div aria-live="polite"><PageHeading
        title="Mis inscripciones"
        description={description}
        actions={offlineReason
          ? <Button variant="outline" disabled title={offlineReason}><CalendarDays aria-hidden="true" />Explorar talleres</Button>
          : <Link href="/events" className={buttonVariants({ variant: "outline" })}><CalendarDays aria-hidden="true" />Explorar talleres</Link>}
      /></div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList aria-label="Secciones de mis inscripciones">
          <TabsTrigger value="current">Vigentes</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="current" className="pt-6">
      {status === "saved" ? <OfflineStatusBanner isOnline={isOnline} lastUpdated={lastUpdated} onRetry={retry} /> : null}
      {isLoading ? (
        <RequestFeedback message="Cargando tus inscripciones..." />
      ) : status === "no-offline-copy" || (status === "error" && error) ? (
        <div className="space-y-6">
          {status === "no-offline-copy" || isConnectionError ? <NoOfflineCopyState /> : null}
          <RequestFeedback message={error ?? DEFAULT_REGISTRATION_ERROR_MESSAGE} isError onRetry={retry} />
        </div>
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
        </TabsContent>
        <TabsContent value="history" className="pt-6">
          {historyUnavailable ? (
            <RequestFeedback message="El historial requiere conexión a Internet." isError onRetry={history.retry} />
          ) : history.isLoading ? (
            <RequestFeedback message="Cargando tu historial..." />
          ) : history.error && history.registrations.length === 0 ? (
            <RequestFeedback message={history.error} isError onRetry={history.retry} />
          ) : history.registrations.length === 0 ? (
            <p className="py-8 text-sm text-text-secondary">Aún no tienes talleres finalizados</p>
          ) : (
            <div className="space-y-6">
              {history.error ? <RequestFeedback message={history.error} isError onRetry={history.retry} /> : null}
              <ul aria-label="Talleres finalizados" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {history.registrations.map((registration) => (
                  <li key={registration.id} className="h-full"><FinishedRegistrationCard registration={registration} /></li>
                ))}
              </ul>
              {history.hasMore ? (
                <Button type="button" variant="outline" disabled={history.isLoadingMore} onClick={history.loadMore}>
                  {history.isLoadingMore ? "Cargando..." : "Cargar más"}
                </Button>
              ) : null}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
