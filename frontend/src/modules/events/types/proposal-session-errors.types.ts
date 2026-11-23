import type { ProposalSession } from './proposal-session.types';

export type ProposalSessionErrors = Partial<Record<keyof ProposalSession, string>>[];
