import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useEventsFilters } from './use-events-filters';

afterEach(() => {
  vi.useRealTimers();
});

describe('useEventsFilters', () => {
  it('starts with empty search, no category and the recommended order', () => {
    const { result } = renderHook(() => useEventsFilters());

    expect(result.current.searchInput).toBe('');
    expect(result.current.categoryId).toBeNull();

    expect(result.current.filters).toEqual({
      search: '',
      categoryId: null,
      sort: 'recommended',
    });
  });

  it('switches to the popular order and back while keeping the category', () => {
    const { result } = renderHook(() => useEventsFilters());

    act(() => {
      result.current.setCategoryId('category-1');
      result.current.setIsPopular(true);
    });

    expect(result.current.isPopular).toBe(true);
    expect(result.current.filters).toEqual({
      search: '',
      categoryId: 'category-1',
      sort: 'popular',
    });

    act(() => {
      result.current.setIsPopular(false);
    });

    expect(result.current.filters.sort).toBe('recommended');
    expect(result.current.filters.categoryId).toBe('category-1');
  });

  it('updates the selected category immediately', () => {
    const { result } = renderHook(() => useEventsFilters());

    act(() => {
      result.current.setCategoryId('category-1');
    });

    expect(result.current.categoryId).toBe('category-1');
    expect(result.current.filters.categoryId).toBe('category-1');
  });

  it('updates the search filter after the debounce delay', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useEventsFilters());

    act(() => {
      result.current.setSearchInput('React');
    });

    expect(result.current.searchInput).toBe('React');
    expect(result.current.filters.search).toBe('');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.filters.search).toBe('React');
  });
});