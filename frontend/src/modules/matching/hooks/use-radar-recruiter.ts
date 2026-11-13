"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { radarRecruiterApi } from "../services/radar-recruiter.service";
import type { RadarAxisId } from "../types/radar-axis-id.types";

export const radarRecruiterQueryKeys = {
  all: ["radar-recruiter"] as const,
  vacancies: () => [...radarRecruiterQueryKeys.all, "vacancies"] as const,
  applicants: (jobOfferId: string) =>
    [...radarRecruiterQueryKeys.all, "applicants", jobOfferId] as const,
  evidence: (applicationId: string, areaId: RadarAxisId) =>
    [
      ...radarRecruiterQueryKeys.all,
      "evidence",
      applicationId,
      areaId,
    ] as const,
};

export function useRecruiterVacancies() {
  return useQuery({
    queryKey: radarRecruiterQueryKeys.vacancies(),
    queryFn: () => radarRecruiterApi.vacancies(),
  });
}

export function useRecruiterApplicants(jobOfferId: string) {
  return useQuery({
    queryKey: radarRecruiterQueryKeys.applicants(jobOfferId),
    queryFn: () => radarRecruiterApi.applicants(jobOfferId),
    enabled: Boolean(jobOfferId),
  });
}

export function useRecruiterAreaEvidence(
  applicationId: string,
  areaId: RadarAxisId | null,
) {
  return useQuery({
    queryKey: radarRecruiterQueryKeys.evidence(
      applicationId,
      areaId ?? "desarrollo",
    ),
    queryFn: () =>
      radarRecruiterApi.areaEvidence(applicationId, areaId as RadarAxisId),
    enabled: Boolean(applicationId && areaId),
  });
}

export function useRecruiterDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      decision,
    }: {
      applicationId: string;
      decision: "hired" | "rejected";
    }) => radarRecruiterApi.decide(applicationId, decision),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: radarRecruiterQueryKeys.all }),
  });
}
