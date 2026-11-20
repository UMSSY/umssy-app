'use client';
import type { MentorSearchBarProps } from '../../types/mentor-search-bar-props.types';

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

const SEARCH_DEBOUNCE_MS = 300;

export function MentorSearchBar({
  value,
  onSearchChange,
}: MentorSearchBarProps) {
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
    <div className="flex w-full min-w-0 flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <Input
          type="search"
          className="h-12 w-full rounded-sm border-border-strong bg-surface pr-4 pl-11 text-[13px]"
          aria-label="Buscar mentores por nombre"
          placeholder="Buscar por nombre, cargo o palabra clave"
          value={inputValue}
          onChange={(event) => {
            inputValueRef.current = event.target.value;
            setInputValue(event.target.value);
          }}
        />
      </div>
      {inputValue ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            inputValueRef.current = '';
            setInputValue('');
          }}
        >
          Limpiar búsqueda
        </Button>
      ) : null}
    </div>
  );
}
