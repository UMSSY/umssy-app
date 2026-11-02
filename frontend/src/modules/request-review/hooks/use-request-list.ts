"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { ALL_CAREERS_VALUE, DEFAULT_PERIOD, MIN_SEARCH_LENGTH, SEARCH_DEBOUNCE_MS } from "../constants/inbox-filters.constants";
import { REQUEST_REVIEW_QUERY_KEYS } from "../constants/request-review-query-keys.constants";
import { REVIEW_PAGE_SIZE } from "../constants/request-review.constants";
import { requestReviewService } from "../services/request-review.service";
import type { InboxPeriod } from "../types/inbox-filters.types";
import type { ValidationResult } from "../types/automatic-validation.types";
import { ALL_VALIDATIONS_VALUE } from "../constants/automatic-validation.constants";
import type { ReviewStatus } from "../types/request-review.types";
import { unwrapReviewResult } from "../utils/unwrap-review-result";

export function useRequestList() {
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [searchInput, setSearchInput] = useState("");
  const [career, setCareer] = useState(ALL_CAREERS_VALUE);
  const [period, setPeriod] = useState<InboxPeriod>(DEFAULT_PERIOD);
  const [validation, setValidation] = useState<string>(ALL_VALIDATIONS_VALUE);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const search = debouncedSearch.length >= MIN_SEARCH_LENGTH ? debouncedSearch : "";
  const careerFilter = career === ALL_CAREERS_VALUE ? "" : career;
  const validationFilter = validation === ALL_VALIDATIONS_VALUE ? undefined : (validation as ValidationResult);

  const filterKey = `${status}|${search}|${careerFilter}|${period}|${validationFilter ?? ""}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;

  const filters = { search, career: careerFilter, period, ...(validationFilter && { validation: validationFilter }) };
  const query = useQuery({
    queryKey: REQUEST_REVIEW_QUERY_KEYS.list(status, page, filters),
    queryFn: async () => unwrapReviewResult(await requestReviewService.listRequests(status, page, undefined, filters)),
  });

  const isLoading = query.isPending;
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const error = query.error?.message ?? null;
  const hasActiveFilters =
    searchInput.trim() !== "" || career !== ALL_CAREERS_VALUE || period !== DEFAULT_PERIOD || validation !== ALL_VALIDATIONS_VALUE;

  function clearFilters() {
    setSearchInput("");
    setCareer(ALL_CAREERS_VALUE);
    setPeriod(DEFAULT_PERIOD);
    setValidation(ALL_VALIDATIONS_VALUE);
  }

  const totalPages = Math.max(1, Math.ceil(total / REVIEW_PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * REVIEW_PAGE_SIZE + 1;
  const to = Math.min(page * REVIEW_PAGE_SIZE, total);

  return {
    status,
    changeStatus: setStatus,
    searchInput,
    career,
    period,
    validation,
    changeSearch: setSearchInput,
    changeCareer: setCareer,
    changePeriod: setPeriod,
    changeValidation: setValidation,
    clearFilters,
    hasActiveFilters,
    page,
    goToPrevious: () => setPageState({ key: filterKey, page: Math.max(1, page - 1) }),
    goToNext: () => setPageState({ key: filterKey, page: Math.min(totalPages, page + 1) }),
    items,
    total,
    from,
    to,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
    isLoading,
    error,
  };
}
