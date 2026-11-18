import { apiClient } from '@/shared/services/api-client';
import type { ApiResponse } from '@/shared/types/api-response.types';
import type { DocumentVerification } from '../types/document-verification.types';
const endpoint = '/profile/me/document-verifications';
export const verificationApi = {
  async list(admin = false, filter = 'pending') {
    const response = await apiClient.get<ApiResponse<DocumentVerification[]>>(
      admin ? '/radar-document-reviews' : endpoint, admin ? {params:{filter}} : undefined,
    );
    return response.data.data;
  },
  async file(id: string, admin = false) {
    const response = await apiClient.get<Blob>(
      `${admin ? '/radar-document-reviews' : endpoint}/${encodeURIComponent(id)}/file`,
      { responseType: 'blob' },
    );
    return response.data;
  },
  async acknowledge(doc: DocumentVerification) {
    await apiClient.patch(
      `${endpoint}/${encodeURIComponent(doc.id)}/notification`,
      { status: doc.status },
    );
  },
  async decide(id: string, decision: 'approved' | 'rejected' | 'revoke' | 'reprocess') {
    await apiClient.patch(`/radar-document-reviews/${encodeURIComponent(id)}`, {
      decision,
    });
  },
};
