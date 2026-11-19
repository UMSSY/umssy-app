"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { APPOINTMENTS_TEXT } from "../constants/appointments.constants";
import {
  APPOINTMENTS_SEARCH_DEBOUNCE_MS,
  APPOINTMENTS_SEARCH_MAX_LENGTH,
} from "../constants/appointments-search.constants";
import type { AppointmentsSearchBarProps } from "../types/appointments-search-bar-props.types";

export function AppointmentsSearchBar({
  value,
  onSearchChange,
}: AppointmentsSearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const inputValueRef = useRef(value);
  const syncingExternalValueRef = useRef(false);

  const debouncedValue = useDebouncedValue(
    inputValue,
    APPOINTMENTS_SEARCH_DEBOUNCE_MS,
  );

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
      maxLength={APPOINTMENTS_SEARCH_MAX_LENGTH}
      value={inputValue}
      onChange={(event) => {
        inputValueRef.current = event.target.value;
        setInputValue(event.target.value);
      }}
    />
  );
}
