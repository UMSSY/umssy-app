import type { ProposalValues } from './proposal.types';

export interface CreateProposalMutation {
  values: ProposalValues;
  cover: File;
  operationKey: string;
  accessToken: string | null;
}
