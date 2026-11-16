"use client";

import { usePortfolioProjects } from "@/modules/profile";

export function useCvPortfolioCount(): number {
  const { projects } = usePortfolioProjects();
  return projects.length;
}
