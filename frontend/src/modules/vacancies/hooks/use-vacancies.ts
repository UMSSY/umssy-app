'use client';

import { useQuery } from '@tanstack/react-query';
import { vacanciesService } from '../services/vacancies.service';

export const VACANCIES_QUERY_KEY = ['vacancies', 'published'] as const;

export function usePublishedVacancies() {
  return useQuery({
    queryKey: VACANCIES_QUERY_KEY,
    queryFn: vacanciesService.list,
  });
}
