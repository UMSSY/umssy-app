import { apiClient } from "@/shared/services/api-client";
import { NOT_FOUND_STATUS } from "../constants/http-status.constants";

import { getAuthHeaders } from "../utils/get-auth-headers";
import { getHttpStatus } from "../utils/get-http-status";

export const profilePhotoService = {
  getPhoto: async (): Promise<Blob | null> => {
    try {
      const response = await apiClient.get<Blob>("/profile/me/photo", {
        responseType: "blob",
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      if (getHttpStatus(error) === NOT_FOUND_STATUS) {
        return null;
      }
      throw error;
    }
  },

  uploadPhoto: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    await apiClient.put("/profile/me/photo", formData, { headers: getAuthHeaders() });
  },

  deletePhoto: async (): Promise<void> => {
    await apiClient.delete("/profile/me/photo", { headers: getAuthHeaders() });
  },
};
