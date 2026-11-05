"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

type MentorSearchBarProps = {
  value: string;
  onSearchChange: (value: string) => void;
};

const SEARCH_DEBOUNCE_MS = 300;

export function MentorSearchBar({
  value,
  onSearchChange,
}: MentorSearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const inputValueRef = useRef(value);
  const syncingExternalValueRef = useRef(false);

  const debouncedValue = useDebouncedValue(
    inputValue,
    SEARCH_DEBOUNCE_MS,
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
      className="min-w-56 flex-1 self-end"
      aria-label="Buscar mentores por nombre"
      placeholder="Buscar por nombre"
      value={inputValue}
      onChange={(event) => {
        inputValueRef.current = event.target.value;
        setInputValue(event.target.value);
      }}
    />
  );
}
