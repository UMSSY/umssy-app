'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button-variants";
import { OFFLINE_PASSES_TEXTS } from "../constants/offline-passes.constants";
import { usePassesViewState } from "../hooks/use-passes-view-state";
import { useCancelRegistration } from '@/modules/event-registrations';
import { OfflineStatusBanner } from "../components/offline-status-banner";
import { NoOfflineCopyState } from "../components/no-offline-copy-state";
import { RequestFeedback } from "../components/request-feedback";
import { PassCard } from "../components/pass-card";
import { PassDetail } from "../components/pass-detail";
import { MyPassesEmptyState } from "../components/my-passes-empty-state";
import { FinishedRegistrationCard } from "../components/finished-registration-card";
import { CancelRegistrationDialog } from "../components/cancel-registration-dialog";
import { RegistrationCancelledBanner } from "../components/registration-cancelled-banner";
import { useMyPassesHistory } from "../hooks/use-my-passes";
import { getHistoryErrorMessage } from "../utils/get-history-error-message";
import {
  getRegistrationEventTimestamp,
  isConfirmedRegistrationStatus,
} from "../utils/registration-format";

import type { MyPassesViewProps } from '../types/my-passes-view-props.types';

export function MyPassesView({
  onOpenWorkshopChat,
  onConfirmCancelRegistration,
}: MyPassesViewProps = {}) {
  const [activeTab, setActiveTab] = useState("current");
  const { status, isOnline, passes: registrations, offlineQrTokens, lastUpdated, error, isConnectionError, removedSavedPasses, retry } = usePassesViewState(activeTab === "current");
  const { cancelRegistration, getErrorMessage } = useCancelRegistration();
  const isLoading = status === "loading";
  const offlineReason = isOnline ? undefined : OFFLINE_PASSES_TEXTS.requiresConnection;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelledBanner, setShowCancelledBanner] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const history = useMyPassesHistory(activeTab === "history" && isOnline);
  const historyUnavailable = activeTab === "history" && !isOnline;
  const [now, setNow] = useState(Date.now);
  const currentRegistrations = registrations.filter((registration) => {
    const closesAt = getRegistrationEventTimestamp(registration.date, registration.endTime);
    return !Number.isFinite(closesAt) || now < closesAt;
  });
  const cancelTarget = cancelTargetId
    ? currentRegistrations.find((item) => item.id === cancelTargetId) ?? null
    : null;
  const cancelTargetStart = cancelTarget
    ? getRegistrationEventTimestamp(cancelTarget.date, cancelTarget.startTime)
    : Number.NaN;
  const canCancelTarget = Boolean(
    cancelTarget &&
      isConfirmedRegistrationStatus(cancelTarget.status) &&
      Number.isFinite(cancelTargetStart) &&
      now < cancelTargetStart,
  );

  useEffect(() => {
    const deadlines = registrations
      .map((registration) => getRegistrationEventTimestamp(registration.date, registration.endTime))
      .filter((closesAt) => Number.isFinite(closesAt) && closesAt > now);
    if (canCancelTarget && Number.isFinite(cancelTargetStart) && cancelTargetStart > now) {
      deadlines.push(cancelTargetStart);
    }
    const nextDeadline = deadlines.sort((left, right) => left - right)[0];
    if (nextDeadline === undefined) return;

    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(2_147_483_647, Math.max(1, nextDeadline - now)),
    );
    return () => window.clearTimeout(timer);
  }, [canCancelTarget, cancelTargetStart, now, registrations]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget || !canCancelTarget || !isOnline || isCancelling) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      if (onConfirmCancelRegistration) {
        await onConfirmCancelRegistration(cancelTarget.id);
      } else {
        await cancelRegistration(cancelTarget.id);
      }
      setCancelTargetId(null);
      setShowCancelledBanner(true);
    } catch (cause) {
      setCancelTargetId(null);
      setShowCancelledBanner(false);
      setCancelError(getErrorMessage(cause));
    } finally {
      setIsCancelling(false);
    }
  };

  const selected =
    currentRegistrations.find((item) => item.id === selectedId) ??
    currentRegistrations[Math.min(selectedIndex, currentRegistrations.length - 1)];

  const visibleCount = activeTab === "history" ? history.total : currentRegistrations.length;
  const showCount = activeTab === "history" ? !history.isLoading && !history.error && !historyUnavailable : !isLoading && status !== "error" && status !== "no-offline-copy";
  const description = showCount ? `${visibleCount} ${visibleCount === 1 ? "pase" : "pases"}` : activeTab === "history" && (history.error || historyUnavailable) ? "" : "Cargando tus inscripciones…";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <div aria-live="polite"><PageHeading
        title="Mis inscripciones"
        description={description}
        actions={<Link href="/events" className={buttonVariants({ variant: "outline" })}><CalendarDays aria-hidden="true" />Explorar talleres</Link>}
      /></div>
      {showCancelledBanner ? (
        <RegistrationCancelledBanner
          onDismiss={() => setShowCancelledBanner(false)}
        />
      ) : null}
      {cancelError ? <RequestFeedback message={cancelError} isError /> : null}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList aria-label="Secciones de mis inscripciones">
          <TabsTrigger value="current">Vigentes</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="current" className="pt-6">
      {status === "saved" ? <OfflineStatusBanner isOnline={isOnline} lastUpdated={lastUpdated} onRetry={retry} /> : null}
      {status === "live" && removedSavedPasses ? <RequestFeedback message="Actualizamos tus pases guardados. Se retiraron los pases que ya no están disponibles." /> : null}
      {!isOnline ? <RequestFeedback message="El chat requiere conexión a Internet." /> : null}
      {isLoading ? (
        <RequestFeedback message="Cargando tus inscripciones..." />
      ) : status === 'no-offline-copy' ? (
        <NoOfflineCopyState />
      ) : status === 'error' && error ? (
        <div className="space-y-6">
          {isConnectionError ? <NoOfflineCopyState /> : null}
          <RequestFeedback message={error} isError onRetry={retry} />
        </div>
      ) : !currentRegistrations.length ? (
        <MyPassesEmptyState />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section aria-label="Tus inscripciones">
            <ul className="space-y-3">
              {currentRegistrations.map((item, index) => (
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
                    onCancelRegistration={
                      isOnline
                        ? (id) => {
                            setCancelError(null);
                            setCancelTargetId(id);
                          }
                        : undefined
                    }
                    cancelDisabledReason={offlineReason}
                    isAvailableOffline={
                      status === 'live' && item.id in offlineQrTokens
                    }
                    isSelected={selected?.id === item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setSelectedIndex(index);
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
          {selected ? (
            <aside
              aria-label="Detalle de la inscripción"
              className="sticky top-24 min-w-0"
            >
              <PassDetail
                registration={selected}
                offlineQrToken={
                  status === 'saved' ? offlineQrTokens[selected.id] : undefined
                }
              />
            </aside>
          ) : null}
        </div>
      )}
        </TabsContent>
        <TabsContent value="history" className="pt-6">
          {historyUnavailable ? (
            <RequestFeedback message="El historial requiere conexión a Internet." />
          ) : history.isLoading ? (
            <RequestFeedback message="Cargando tu historial..." />
          ) : history.error ? (
            <RequestFeedback message={getHistoryErrorMessage(history.error)} isError onRetry={history.retry} />
          ) : history.registrations.length === 0 ? (
            <p className="py-8 text-sm text-text-secondary">Aún no tienes talleres finalizados</p>
          ) : (
            <div className="space-y-6">
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

      <CancelRegistrationDialog
        open={canCancelTarget}
        pending={isCancelling}
        disabled={!isOnline}
        onClose={() => {
          if (!isCancelling) setCancelTargetId(null);
        }}
        onConfirm={handleConfirmCancel}
      />
    </main>
  );
}
