"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { DEFAULT_AUDIT_FILTERS } from "../constants/audit-log.constants";
import { INVALID_PERIOD_MESSAGE, MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from "../constants/audit-log-filters.constants";
import type { AuditAction } from "../types/audit-event.types";
import type { AuditLogFilters } from "../types/audit-log-filters.types";
import { getCurrentMonthPeriod } from "../utils/get-current-month-period";

// El campo de fecha entrega AAAA-MM-DD solo cuando la fecha está completa y existe
const isCompleteDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export function useAuditFilters() {
  // El período arranca con el mes en curso y Limpiar filtros vuelve a él
  const [defaultPeriod] = useState(getCurrentMonthPeriod);
  const [searchInput, setSearchInput] = useState(DEFAULT_AUDIT_FILTERS.search);
  const [action, setAction] = useState<AuditAction | "">(DEFAULT_AUDIT_FILTERS.action);
  const [responsibleId, setResponsibleId] = useState(DEFAULT_AUDIT_FILTERS.responsibleId);
  const [from, setFrom] = useState(defaultPeriod.from);
  const [to, setTo] = useState(defaultPeriod.to);

  // Espera corta para no enviar una petición por cada tecla
  const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const search = debouncedSearch.length >= MIN_SEARCH_LENGTH ? debouncedSearch : "";
  const fromDate = isCompleteDate(from) ? from : "";
  const toDate = isCompleteDate(to) ? to : "";
  const periodError = fromDate && toDate && fromDate > toDate ? INVALID_PERIOD_MESSAGE : null;

  // Una fecha incompleta o un período inválido no se envían al servidor; el error se muestra junto a las fechas
  const filters: AuditLogFilters = useMemo(
    () => ({ search, action, responsibleId, from: periodError ? "" : fromDate, to: periodError ? "" : toDate }),
    [search, action, responsibleId, fromDate, toDate, periodError],
  );

  // El mes en curso es el valor inicial, no cuenta como filtro activo
  const isDefaultPeriod = from === defaultPeriod.from && to === defaultPeriod.to;
  const activeCount = [searchInput.trim(), action, responsibleId, !isDefaultPeriod].filter(Boolean).length;

  function clear() {
    setSearchInput(DEFAULT_AUDIT_FILTERS.search);
    setAction(DEFAULT_AUDIT_FILTERS.action);
    setResponsibleId(DEFAULT_AUDIT_FILTERS.responsibleId);
    setFrom(defaultPeriod.from);
    setTo(defaultPeriod.to);
  }

  return {
    values: { searchInput, action, responsibleId, from, to },
    handlers: {
      onSearchChange: setSearchInput,
      onActionChange: setAction,
      onResponsibleChange: setResponsibleId,
      onFromChange: setFrom,
      onToChange: setTo,
      onClear: clear,
    },
    filters,
    activeCount,
    hasActiveFilters: activeCount > 0,
    periodError,
  };
}
