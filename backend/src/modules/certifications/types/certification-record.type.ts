export interface CertificationRecord {
  id: string;
  userId: string;
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  // Virtual metadata read from the existing audit JSON, never Prisma columns.
  documentFileName?: string | null;
  documentMimeType?: string | null;
  documentSizeBytes?: number | null;
  documentUploadedAt?: Date | null;
}
