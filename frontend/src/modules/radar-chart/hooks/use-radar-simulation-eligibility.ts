"use client";

import { useQuery } from "@tanstack/react-query";
import { radarIntegrationApi } from "../services/radar-integration.service";

export function useRadarSimulationEligibility(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["radar-simulation-eligibility", userId],
    queryFn: radarIntegrationApi.simulationEligibility,
    enabled: enabled && Boolean(userId),
    refetchInterval: 30_000,
    retry: false,
  });
}
