"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { skillsService } from "../services/skills.service";

export const skillCatalogOptions = queryOptions({
  queryKey: ["skills", "catalog"],
  queryFn: () => skillsService.getCatalog(),
});

export function useSkillCatalog(enabled: boolean) {
  return useQuery({ ...skillCatalogOptions, enabled, staleTime: 5 * 60 * 1000 });
}
