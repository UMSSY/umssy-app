"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { VACANCY_QUERY_KEYS } from "../constants/vacancies.constants";
import { vacanciesService } from "../services/vacancies.service";
import { filterVacancies } from "../utils/filter-vacancies";

export function useVacancies() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: VACANCY_QUERY_KEYS.published,
    queryFn: vacanciesService.listPublished,
  });

  const vacancies = useMemo(() => query.data ?? [], [query.data]);

  const filteredVacancies = useMemo(() => filterVacancies(vacancies, search), [search, vacancies]);

  return {
    search,
    setSearch,
    vacancies,
    filteredVacancies,
    isLoading: query.isPending,
    isError: query.isError,
    retry: query.refetch,
  };
}
