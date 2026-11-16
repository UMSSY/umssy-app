import { apiClient } from "@/shared/services/api-client";

import type { ApiResponse } from "@/modules/profile";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionResponse } from "../types/cv-extraction-response.types";
import type { CvPage } from "../types/cv-page.types";
import type { CvPageResponse } from "../types/cv-page-response.types";
import type { CvResponse } from "../types/cv-response.types";
import type { SavedCv } from "../types/saved-cv.types";
import { getAuthHeaders } from "@/modules/profile";
import { toCvExtraction } from "../utils/to-cv-extraction";
import { toCvPage } from "../utils/to-cv-page";
import { toSavedCv } from "../utils/to-saved-cv";
import { toUploadPercent } from "../utils/to-upload-percent";

export const documentsService = {
  getCvs: async (page: number, limit: number): Promise<CvPage> => {
    const response = await apiClient.get<ApiResponse<CvPageResponse | null>>("/profile/me/cvs", {
      headers: getAuthHeaders(),
      params: { page, limit },
    });
    return toCvPage(response.data.data);
  },

  uploadCv: async (file: File, onProgress?: (percent: number) => void): Promise<SavedCv | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<ApiResponse<CvResponse | null>>("/profile/me/cvs", formData, {
      headers: getAuthHeaders(),
      onUploadProgress: (event) => {
        const percent = toUploadPercent(event.loaded, event.total);
        if (onProgress && percent !== null) onProgress(percent);
      },
    });
    const cv = response.data.data;
    return cv ? toSavedCv(cv) : null;
  },

  getCvFile: async (cvId: string): Promise<Blob> => {
    const response = await apiClient.get<Blob>(`/profile/me/cvs/${encodeURIComponent(cvId)}/file`, {
      headers: getAuthHeaders(),
      responseType: "blob",
    });
    return response.data;
  },

  generateCv: async (): Promise<{ file: Blob; fileName: string }> => {
    const response = await apiClient.post<Blob>(
      "/profile/cv/generate",
      {},
      {
        headers: getAuthHeaders(),
        responseType: "blob",
      },
    );
    const disposition = response.headers?.["content-disposition"] as string | undefined;
    const match = disposition ? /filename="?([^";]+)"?/i.exec(disposition) : null;
    const fileName = match ? match[1] : "CV.pdf";
    return { file: response.data, fileName };
  },

  extractCvData: async (cvId: string): Promise<CvExtraction> => {
    const response = await apiClient.post<ApiResponse<CvExtractionResponse>>(
      `/profile/me/cvs/${encodeURIComponent(cvId)}/extraction`,
      {},
      { headers: getAuthHeaders() },
    );
    return toCvExtraction(response.data.data);
  },

  deleteCv: async (cvId: string): Promise<void> => {
    await apiClient.delete(`/profile/me/cvs/${encodeURIComponent(cvId)}`, {
      headers: getAuthHeaders(),
    });
  },
};
