"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AutomationSummaryCardsProps } from "../../types/automatic-validation-props.types";

const CARD_CLASS = "flex flex-col gap-1 rounded-lg border border-border bg-surface px-5 py-4";
const CARD_COUNT = 4;

export function AutomationSummaryCards({ automation, inbox, isLoading, error, onRetry }: AutomationSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="automation-summary-skeleton" aria-busy="true">
        {Array.from({ length: CARD_COUNT }, (_, index) => (
          <div key={index} className={CARD_CLASS}>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !automation) {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink">{error ?? "No se pudo cargar el resumen de la validación automática."}</p>
        <Button type="button" variant="outline" onClick={onRetry} className="border-border bg-surface text-ink">
          Reintentar
        </Button>
      </div>
    );
  }

  const average = inbox?.averageReviewHours;
  const cards = [
    {
      title: "Requieren revisión manual",
      value: automation.manualReviewCount,
      note: inbox && inbox.pendingOver24hCount > 0 ? `${inbox.pendingOver24hCount} esperan más de 24 horas` : "Ninguna espera más de 24 horas",
    },
    { title: "Aprobadas automáticamente hoy", value: automation.autoApprovedTodayCount, note: `de ${automation.receivedTodayCount} solicitudes recibidas` },
    { title: "Rechazadas automáticamente hoy", value: automation.autoRejectedTodayCount, note: "archivo ilegible o no corresponde" },
    {
      title: "Tiempo medio de dictamen",
      value: average === null || average === undefined ? "Sin datos" : `${average} h`,
      note: inbox ? `meta ${inbox.reviewTimeGoalHours} h` : null,
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className={CARD_CLASS}>
          <dt className="text-xs font-semibold tracking-wide text-text-secondary uppercase">{card.title}</dt>
          <dd className="font-tight text-2xl leading-tight font-bold text-ink">{card.value}</dd>
          {card.note ? <dd className="text-xs text-text-secondary">{card.note}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
