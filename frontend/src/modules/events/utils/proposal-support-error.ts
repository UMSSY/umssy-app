import { parseApiError } from '@/shared/utils/parse-api-error';
import {
  DEFAULT_PROPOSAL_SUPPORT_ERROR_MESSAGE,
  PROPOSAL_SUPPORT_ERROR_MESSAGES,
} from '../constants/proposal-support-errors.constants';

function isProposalSupportErrorCode(
  code: string,
): code is keyof typeof PROPOSAL_SUPPORT_ERROR_MESSAGES {
  return Object.hasOwn(PROPOSAL_SUPPORT_ERROR_MESSAGES, code);
}

export function getProposalSupportErrorMessage(error: unknown): string {
  const code = parseApiError(error)?.code;
  return code && isProposalSupportErrorCode(code)
    ? PROPOSAL_SUPPORT_ERROR_MESSAGES[code]
    : DEFAULT_PROPOSAL_SUPPORT_ERROR_MESSAGE;
}
