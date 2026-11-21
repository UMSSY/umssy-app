"use client";

import { useState } from "react";

export type ExpirationStatus = "disabled" | "selecting" | "confirming" | "confirmed";

interface ExpirationState {
  status: ExpirationStatus;
  date: Date | null;
}

const INITIAL_STATE: ExpirationState = { status: "disabled", date: null };

export function useExpirationDate() {
  const [state, setState] = useState<ExpirationState>(INITIAL_STATE);

  function toggleExpiration(checked: boolean) {
    setState(checked ? { status: "selecting", date: null } : INITIAL_STATE);
  }

  function selectDate(date: Date | undefined) {
    if (!date) return; 
    setState({ status: "confirming", date });
  }

  function confirmDate() {
    setState((prev) =>
      prev.status === "confirming" && prev.date ? { status: "confirmed", date: prev.date } : prev,
    );
  }

  function rejectDate() {
    setState((prev) => (prev.status === "confirming" ? { status: "selecting", date: null } : prev));
  }

  function changeDate() {
    setState((prev) => (prev.status === "confirmed" ? { status: "selecting", date: prev.date } : prev));
  }

  function resetExpiration() {
    setState(INITIAL_STATE);
  }

  return {
    status: state.status,
    selectedDate: state.date,
    hasExpiration: state.status !== "disabled",
    confirmedDate: state.status === "confirmed" ? state.date : null,
    isExpirationValid: state.status === "disabled" || state.status === "confirmed",
    toggleExpiration,
    selectDate,
    confirmDate,
    rejectDate,
    changeDate,
    resetExpiration,
  };
}

export type ExpirationDate = ReturnType<typeof useExpirationDate>;