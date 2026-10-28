import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { ActivateMentorPayload } from "../types/activate-mentor-payload.types";
import type { ActivateMentorResponse } from "../types/activate-mentor-response.types";
import { withMentorIntakeKey } from "./mentor-intake-idempotency";

export async function activateMentor(
  payload: ActivateMentorPayload,
): Promise<ActivateMentorResponse> {
  return withMentorIntakeKey("activate", payload, async (key) => {
    const response = await apiClient.post<ApiResponse<ActivateMentorResponse>>(
      "/mentors/activate",
      payload,
      { headers: { "Idempotency-Key": key } },
    );

    return response.data.data;
  });
}
