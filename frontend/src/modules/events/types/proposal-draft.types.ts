import type { ProposalValues } from './proposal.types';

export interface ProposalDraft { locations?: { presencial: string; virtual: string }; values: ProposalValues; file: File | null; operationKey: string | null }
