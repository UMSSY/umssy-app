import { apiClient } from "@/shared/services/api-client";
import type {
  AccessRequestListApiResponse,
  AccessRequestListPayload,
  AccessRequestListResponse,
} from "../types/request-review.types";
import { listMockRequests } from "./request-review.mock";

// TODO: poner en false y borrar request-review.mock.ts cuando exista GET /access-requests (1.2.1-B1)
const USE_MOCK_DATA = true;

export const requestReviewService = {
  list: async (payload: AccessRequestListPayload): Promise<AccessRequestListResponse> => {
    if (USE_MOCK_DATA) {
      return listMockRequests(payload);
    }

    const response = await apiClient.get<AccessRequestListApiResponse>("/access-requests", {
      params: payload,
    });

    return {
      items: response.data.data,
      total: response.data.total,
      page: response.data.page,
    };
  },
};