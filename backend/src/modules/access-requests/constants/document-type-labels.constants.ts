import { ACCESS_REQUEST_DOCUMENT_TYPE } from '../types/access-request.enum.js';

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  [ACCESS_REQUEST_DOCUMENT_TYPE.ACADEMIC_DIPLOMA]: 'Diploma académico',
  [ACCESS_REQUEST_DOCUMENT_TYPE.NATIONAL_TITLE]: 'Título en provisión nacional',
};
