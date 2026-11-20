'use client';
import { PageHeading } from '@/shared/components/layout';
import { DocumentReviewPanel } from '../components/document-review-panel';

export function ReviewQueueView() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <PageHeading
        title="Revisión documental y de radares"
        description="Consulta los respaldos y resuelve las verificaciones documentales."
      />
      <DocumentReviewPanel />
    </main>
  );
}
