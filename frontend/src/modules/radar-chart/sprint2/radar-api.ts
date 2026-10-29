import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { Epic2RadarSource } from "./types";

/** Endpoint implemented by Epic 2; available only after its integration into the target backend. */
export async function getCurrentProfileSkills(): Promise<Epic2RadarSource> {
  const response = await apiClient.get<ApiResponse<Epic2RadarSource>>("/profile/skills-for-radar");
  if (!response.data.ok || !response.data.data) throw new Error("No fue posible consultar habilidades");
  return response.data.data;
}
