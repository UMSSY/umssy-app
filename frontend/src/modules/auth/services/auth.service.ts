import { apiClient } from "@/shared/services/api-client";
import type { LoginPayload, LoginResponse } from "../types/auth-types";

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", payload);
    return response.data;
  },
};