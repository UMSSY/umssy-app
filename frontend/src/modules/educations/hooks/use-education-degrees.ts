"use client";
import { useQuery } from "@tanstack/react-query";
import { educationsService } from "../services/educations.service";

export function useEducationDegrees() {
  return useQuery({
    queryKey: ["education", "degrees"],
    queryFn: ({ signal }) => educationsService.getDegrees(signal),
    staleTime: Infinity,
  });
}
