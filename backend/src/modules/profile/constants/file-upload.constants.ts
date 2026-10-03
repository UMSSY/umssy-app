import type { FileType } from '../types/file-type.type.js';

export const MAX_FILE_SIZE_MB = 5;

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const CV_ALLOWED_FILE_TYPES: readonly FileType[] = ['pdf'];
