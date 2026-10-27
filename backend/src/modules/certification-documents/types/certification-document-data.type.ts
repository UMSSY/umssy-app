import type { CertificationDocumentMetadata } from './certification-document-metadata.type.js';

export type CertificationDocumentData = (CertificationDocumentMetadata & { documentUrl: Uint8Array<ArrayBuffer> }) | {
  documentUrl: null;
  documentFileName: null;
  documentMimeType: null;
  documentSizeBytes: null;
  documentUploadedAt: null;
};
