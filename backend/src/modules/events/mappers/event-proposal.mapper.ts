import type { Event } from '../../../prisma/client.js';

export function mapCreatedProposal(event: Event) {
  return { id: event.id, status: 'voting' as const, supportThreshold: event.supportThreshold, votingDeadline: event.votingDeadline?.toISOString(), coverUrl: '/events/' + event.id + '/cover' };
}

export function mapProposalCover(content: Uint8Array, mimeType: string) {
  return { content: Buffer.from(content), mimeType };
}
