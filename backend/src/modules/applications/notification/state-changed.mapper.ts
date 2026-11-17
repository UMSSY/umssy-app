import { STATUS_CODE_BY_TITLE } from './state-changed.constants.js';
import type { ApplicationStatusCode } from './application-status-code.types.js';
import type { ApplicationStatus } from '../types/applications.types.js';

export function toApplicationStatusCode(
  title: string,
): ApplicationStatusCode | undefined {
  return STATUS_CODE_BY_TITLE[title as ApplicationStatus];
}
