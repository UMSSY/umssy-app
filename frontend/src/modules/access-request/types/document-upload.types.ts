export interface UploadedDocumentResponse {
  id: string;
  name: string;
  size: number; // bytes
  mimeType: string;
}

export interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  detail: string;
  ok: boolean;
}
