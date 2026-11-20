import type { ProposalValues } from './proposal.types';
import type { ProposalSession } from './proposal-session.types';

export interface ProposalDraft { locations?: { presencial: string; virtual: string }; values: ProposalValues; sessions?: ProposalSession[]; file: File | null; operationKey: string | null }
