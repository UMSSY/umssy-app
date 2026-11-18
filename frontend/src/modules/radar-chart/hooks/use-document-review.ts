'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRadarReviewOperationRecovery } from '../hooks/use-radar-integration-queries';
import { submitRadarReviewDecision } from '../services/radar-review-operation.service';

import { verificationApi, type DocumentVerification } from '@/modules/cv';
import type { DocumentReviewConfirmation } from '../types/document-review-confirmation.types';
import type { DocumentReviewPreview } from '../types/document-review-preview.types';
import type { DocumentReviewDecision } from '../types/document-review-decision.types';
export function useDocumentReview() {
  useRadarReviewOperationRecovery('cv');
  const [filter, setFilter] = useState('pending');
  const queue = useQuery({
    queryKey: ['radar-integration', 'document-reviews', filter],
    queryFn: () => verificationApi.list(true, filter),
    refetchInterval: 15000,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmation, setConfirmation] =
    useState<DocumentReviewConfirmation | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<DocumentReviewPreview | null>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  const mutation = useMutation({
    mutationFn: async ({ id, decision }: DocumentReviewConfirmation) => {
      if (decision !== 'approved' && decision !== 'rejected') {
        return verificationApi.decide(id, decision);
      }

      return submitRadarReviewDecision({ kind: 'cv', id, decision });
    },
    onSuccess: () => {
      setConfirmation(null);
      setError('');
    },
    onError: () => {
      setError(
        'No se pudo confirmar la decisión. Puedes reintentar; se conservará el identificador de la operación.',
      );
    },
    onSettled: () => queue.refetch(),
  });

  const rows = queue.data ?? [];
  const item = rows.find((d) => d.id === selected) ?? rows[0];
  const actions: DocumentReviewDecision[] = !item
    ? []
    : item.status === 'legacy'
      ? ['reprocess']
      : ['review', 'low_confidence'].includes(item.status)
        ? ['approved', 'rejected', 'reprocess']
        : ['approved', 'manual_approved'].includes(item.status)
          ? ['revoke']
          : [];
  async function open(row: DocumentVerification) {
    try {
      const file = await verificationApi.file(row.id, true);
      setPreview({ url: URL.createObjectURL(file), name: row.filename });
      setError('');
    } catch {
      setError('El respaldo no está disponible.');
    }
  }
  return {
    filter,
    setFilter,
    queue,
    setSelected,
    confirmation,
    setConfirmation,
    error,
    preview,
    setPreview,
    mutation,
    rows,
    item,
    actions,
    open,
  };
}
