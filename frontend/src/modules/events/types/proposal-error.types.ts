import type { ProposalErrors } from './proposal.types';

export interface ProposalError {
  message: string;
  fields: ProposalErrors;
}
