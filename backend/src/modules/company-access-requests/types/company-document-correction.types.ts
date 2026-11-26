import type { Prisma } from '../../../prisma/client.js';

export interface CompanyDocumentCorrectionContext {
  requestId: string;
  requestCode: string;
  previousFileId: string | null;
  revision: Date;
}

export interface CompanyDocumentCorrectionSnapshot {
  id: string;
  requestCode: string | null;
  documentFileId: string | null;
  reviewedAt: Date | null;
  status: { title: string };
}

export interface CompanyDocumentCorrectionRequest {
  params: { code?: unknown };
  headers: { authorization?: unknown };
  companyDocumentCorrection?: CompanyDocumentCorrectionContext;
}

export interface ReplaceCompanyDocumentOperation {
  context: CompanyDocumentCorrectionContext;
  createFile: (
    tx: Prisma.TransactionClient,
  ) => Promise<{ id: string }>;
}

export interface CompanyDocumentCorrectionResponse {
  requestCode: string;
  status: 'PENDING';
}
