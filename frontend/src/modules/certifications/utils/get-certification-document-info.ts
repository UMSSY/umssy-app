import type { UploadedDocumentInfo } from '@/modules/profile';
import type { Certification } from '../types/certification.types';
import { formatIssueDate } from './format-issue-date';
import { getFileFormat } from './get-file-format';

export function getCertificationDocumentInfo(certification: Certification): UploadedDocumentInfo | undefined {
  const metadata = certification.document;
  if (!metadata) return undefined;
  return {
    fileName: metadata.fileName,
    format: getFileFormat(metadata.fileName),
    uploadedAt: formatIssueDate(metadata.uploadedAt.slice(0, 10)),
  };
}
