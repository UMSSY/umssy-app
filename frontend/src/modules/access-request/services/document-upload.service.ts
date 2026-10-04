import { apiClient } from '@/shared/services/api-client';

import type {
  ApiEnvelope,
  UploadedDocumentResponse,
} from '../types/document-upload.types';

// TODO: confirmar las rutas reales con el endpoint de 1.1.2-B2 y 1.1.2-B3
export async function uploadDocument(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadedDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiEnvelope<UploadedDocumentResponse>>(
    '/files',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        const total = event.total ?? file.size;
        onProgress(Math.round((event.loaded * 100) / total));
      },
    },
  );

  return response.data.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/files/${documentId}`);
}
