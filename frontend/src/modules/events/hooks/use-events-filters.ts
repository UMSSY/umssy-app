'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import {
  DEFAULT_EVENT_SORT,
  POPULAR_EVENT_SORT,
} from '../constants/events.constants';
import type { EventFiltersPayload } from '../types/event-filters.types';

export function useEventsFilters() {
  const [searchInput, setSearchInput] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isPopular, setIsPopular] = useState(false);

  const search = useDebouncedValue(searchInput, 300);

  const filters: EventFiltersPayload = {
    search,
    categoryId,
    sort: isPopular ? POPULAR_EVENT_SORT : DEFAULT_EVENT_SORT,
  };

  return {
    searchInput,
    setSearchInput,
    categoryId,
    setCategoryId,
    isPopular,
    setIsPopular,
    filters,
  };
}
