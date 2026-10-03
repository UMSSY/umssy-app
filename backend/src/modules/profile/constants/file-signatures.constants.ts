import type { FileSignature } from '../types/file-signature.type.js';

export const FILE_SIGNATURES: readonly FileSignature[] = [
  { type: 'pdf', mimeType: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { type: 'png', mimeType: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: 'jpg', mimeType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
];
