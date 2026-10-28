import { apiClient } from "@/shared/services/api-client";
import { CV_ENDPOINT, CV_UPLOAD_FIELD_NAME } from "../constants/cv-api.constants";
import type { ApiResponse } from "@/modules/profile";
import type { CvPage } from "../types/cv-page.types";
import type { CvPageResponse } from "../types/cv-page-response.types";
import type { CvResponse } from "../types/cv-response.types";
import type { SavedCv } from "../types/saved-cv.types";
import { getAuthHeaders } from "@/modules/profile";
import { toCvPage } from "../utils/to-cv-page";
import { toSavedCv } from "../utils/to-saved-cv";

export const documentsService = {
  getCvs: async (page: number, limit: number): Promise<CvPage> => {
    const response = await apiClient.get<ApiResponse<CvPageResponse | null>>(CV_ENDPOINT, {
      headers: getAuthHeaders(),
      params: { page, limit },
    });
    return toCvPage(response.data.data);
  },

  uploadCv: async (file: File): Promise<SavedCv | null> => {
    const formData = new FormData();
    formData.append(CV_UPLOAD_FIELD_NAME, file);
    const response = await apiClient.post<ApiResponse<CvResponse | null>>(CV_ENDPOINT, formData, {
      headers: getAuthHeaders(),
    });
    const cv = response.data.data;
    return cv ? toSavedCv(cv) : null;
  },

  getCvFile: async (cvId: string): Promise<Blob> => {
    const response = await apiClient.get<Blob>(`${CV_ENDPOINT}/${encodeURIComponent(cvId)}/file`, {
      headers: getAuthHeaders(),
      responseType: "blob",
    });
    return response.data;
  },

  deleteCv: async (cvId: string): Promise<void> => {
    await apiClient.delete(`${CV_ENDPOINT}/${encodeURIComponent(cvId)}`, {
      headers: getAuthHeaders(),
    });
  },
};
