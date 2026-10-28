"use client";

import { useEffect, useState } from "react";
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
  const debouncedValue = useDebouncedValue(
    inputValue,
    SEARCH_DEBOUNCE_MS,
  );

  useEffect(() => {
    const trimmedValue = debouncedValue.trim();

    if (trimmedValue !== value) {
      onSearchChange(trimmedValue);
    }
  }, [debouncedValue, onSearchChange, value]);

  return (
    <Input
      type="search"
      className="min-w-56 flex-1"
      aria-label="Buscar mentores por nombre"
      placeholder="Buscar por nombre"
      value={inputValue}
      onChange={(event) => setInputValue(event.target.value)}
    />
  );
}
