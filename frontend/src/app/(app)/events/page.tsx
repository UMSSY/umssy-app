'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EventsView } from '@/modules/events';

function EventsContent() {
  const proposal = useSearchParams().get('proposal');
  return (
    <EventsView
      key={proposal ?? 'browse'}
      initialProposalId={proposal ?? null}
    />
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={null}>
      <EventsContent />
    </Suspense>
  );
}
