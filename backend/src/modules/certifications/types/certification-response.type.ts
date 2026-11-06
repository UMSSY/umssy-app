export interface CertificationResponse {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  hasDocument: boolean;
  createdAt: string;
  updatedAt: string;
  document?: { fileName: string; mimeType: string; sizeBytes: number; uploadedAt: string };
}
