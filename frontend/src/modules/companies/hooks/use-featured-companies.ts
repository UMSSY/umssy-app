"use client";
import { useQuery } from "@tanstack/react-query";
import { companiesService } from "../services/companies.service";

export function useFeaturedCompanies() {
  return useQuery({
    queryKey: ["featured-companies"],
    queryFn: ({ signal }) => companiesService.getFeaturedCompanies(signal),
    staleTime: 60_000,
  });
}