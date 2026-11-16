"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { APPOINTMENTS_TEXT } from "../constants/appointments.constants";
import type { AppointmentsSearchBarProps } from "../types/appointments-search-bar-props.types";

const SEARCH_DEBOUNCE_MS = 300;

export function AppointmentsSearchBar({
  value,
  onSearchChange,
}: AppointmentsSearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const inputValueRef = useRef(value);
  const syncingExternalValueRef = useRef(false);

  const debouncedValue = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (inputValueRef.current === value) {
      return;
    }

    syncingExternalValueRef.current = true;
    inputValueRef.current = value;

    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const trimmedValue = debouncedValue.trim();

    if (syncingExternalValueRef.current) {
      if (trimmedValue === value) {
        syncingExternalValueRef.current = false;
      }

      return;
    }

    if (trimmedValue !== value) {
      onSearchChange(trimmedValue);
    }
  }, [debouncedValue, onSearchChange, value]);

  return (
    <Input
      type="search"
      className="min-w-56"
      aria-label={APPOINTMENTS_TEXT.searchLabel}
      placeholder={APPOINTMENTS_TEXT.searchPlaceholder}
      value={inputValue}
      onChange={(event) => {
        inputValueRef.current = event.target.value;
        setInputValue(event.target.value);
      }}
    />
  );
}
