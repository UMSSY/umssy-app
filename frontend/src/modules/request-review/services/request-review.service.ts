import { apiClient } from "@/shared/services/api-client";
import type {
  ApiResponse,
  ApproveRequestResponse,
} from "../types/request-review-types";

export const requestReviewService = {
  approveRequest: async (requestId: string): Promise<ApproveRequestResponse> => {
    const response = await apiClient.patch<ApiResponse<ApproveRequestResponse>>(
      `/access-requests/${encodeURIComponent(requestId)}/approve`,
    );
    return response.data.data;
  },
};
