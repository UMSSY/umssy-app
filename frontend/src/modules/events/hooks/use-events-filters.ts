'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import type { EventFiltersPayload } from '../types/event-filters.types';

export function useEventsFilters() {
  const [searchInput, setSearchInput] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const search = useDebouncedValue(searchInput, 300);

  const filters: EventFiltersPayload = {
    search,
    categoryId,
  };

  return {
    searchInput,
    setSearchInput,
    categoryId,
    setCategoryId,
    filters,
  };
}
