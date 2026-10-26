import type { ProposalValues } from '../types/proposal.types';

export const PROPOSAL_TITLE_LIMIT = 80;
export const PROPOSAL_DESCRIPTION_LIMIT = 300;
export const PROPOSAL_COVER_MAX_BYTES = 5 * 1024 * 1024;
export const PROPOSAL_COVER_ACCEPT = 'image/jpeg,image/png';
export const PROPOSAL_ENDPOINT = '/event-proposals';
export const EMPTY_PROPOSAL: ProposalValues = {
  title: '', description: '', categoryId: '', eventDate: '',
  startTime: '', endTime: '', capacity: '', modality: 'presencial', location: '',
};
