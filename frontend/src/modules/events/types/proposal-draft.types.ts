import type { ProposalValues } from './proposal.types';

export interface ProposalDraft { values: ProposalValues; file: File | null; operationKey: string | null }
