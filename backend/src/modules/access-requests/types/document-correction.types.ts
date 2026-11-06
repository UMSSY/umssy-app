import type { Prisma } from '../../../prisma/client.js';
import type { FileMetadata } from '../../files/types/file.types.js';
import type { AccessRequestAuditSource } from './access-request-audit.types.js';

export interface DocumentCorrectionContext {
  accessRequestId: string;
  requestCode: string;
  previousFileId: string | null;
  revision: Date;
}

export interface DocumentCorrectionGrant {
  requestCode: string;
  token: string;
}

export interface DocumentCorrectionSnapshot extends AccessRequestAuditSource {
  status: { title: string };
  updatedAt: Date;
}

export interface ReplaceRejectedDocumentOperation {
  context: DocumentCorrectionContext;
  documentType: string;
  createFile: (tx: Prisma.TransactionClient) => Promise<FileMetadata>;
  onReplaced: (
    previous: AccessRequestAuditSource,
    file: FileMetadata,
    tx: Prisma.TransactionClient,
  ) => Promise<void>;
}

export interface DocumentCorrectionResponse {
  requestCode: string;
  status: 'pending';
}
