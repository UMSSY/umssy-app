import { apiClient } from "@/shared/services/api-client";
import { ENV_CONFIG } from "@/shared/config/env.config";
import { buildDevUserHeaders } from "../dev/dev-user";
import type {
  CityOption,
  PersonalInfoValues,
  PresentationValues,
  UserProfile,
} from "../types/profile.types";

const buildAuthHeaders = buildDevUserHeaders;

export const profileService = {
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>("/profile/me", {
      headers: buildAuthHeaders(),
    });
    return response.data;
  },

  getCities: async (): Promise<CityOption[]> => {
    const response = await apiClient.get<CityOption[]>("/profile/cities");
    return response.data;
  },

  updatePersonalInfo: async (values: PersonalInfoValues): Promise<UserProfile> => {
    const response = await apiClient.patch<UserProfile>(
      "/profile/me/personal-info",
      values,
      { headers: buildAuthHeaders() },
    );
    return response.data;
  },

  updatePresentation: async (values: PresentationValues): Promise<UserProfile> => {
    const response = await apiClient.patch<UserProfile>(
      "/profile/me/presentation",
      values,
      { headers: buildAuthHeaders() },
    );
    return response.data;
  },

  uploadPhoto: async (file: File): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await apiClient.put<UserProfile>("/profile/me/photo", formData, {
      headers: buildAuthHeaders(),
    });
    return response.data;
  },

  removePhoto: async (): Promise<UserProfile> => {
    const response = await apiClient.delete<UserProfile>("/profile/me/photo", {
      headers: buildAuthHeaders(),
    });
    return response.data;
  },

  buildPhotoUrl: (photoPath: string | null): string | null =>
    photoPath ? `${ENV_CONFIG.apiUrl ?? ""}${photoPath}` : null,
};
