"use client";

import { useQuery } from "@tanstack/react-query";
import { CV_EXPORT_PORTFOLIO_COUNT_QUERY_KEY } from "../constants/cv-export.constants";
import { documentsService } from "../services/documents.service";

export function useCvPortfolioCount(): number {
  const { data } = useQuery({
    queryKey: CV_EXPORT_PORTFOLIO_COUNT_QUERY_KEY,
    queryFn: () => documentsService.getPortfolioProjectCount(),
    retry: false,
  });

  return data ?? 0;
}
