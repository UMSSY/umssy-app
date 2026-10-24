import { EventsView } from '@/modules/events';

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ proposal?: string }> }) {
  const { proposal } = await searchParams;
  return <EventsView key={proposal ?? 'browse'} initialProposalId={proposal ?? null} />;
}
