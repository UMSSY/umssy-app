import type { ProposalValues } from './proposal.types';
import type { ProposalSession } from './proposal-session.types';

export interface CreateProposalMutation {
  values: ProposalValues;
  sessions?: ProposalSession[];
  cover: File;
  operationKey: string;
  accessToken: string | null;
}
