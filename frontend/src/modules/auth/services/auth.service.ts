import { apiClient } from "@/shared/services/api-client";
import type { ApiEnvelope } from "@/shared/types/api-envelope";
import type { LoginPayload, LoginResponse } from "../types/auth-types";

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiEnvelope<LoginResponse>>("/auth/login", payload);
    return response.data.data;
  },
};