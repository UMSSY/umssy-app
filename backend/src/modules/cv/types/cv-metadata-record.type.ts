export interface CvMetadataRecord {
  id: string | null;
  firstName: string;
  lastName: string;
  fileName: string | null;
  sizeBytes: number | null;
  uploadedAt: Date | null;
  isCurrent: boolean;
}
