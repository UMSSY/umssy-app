'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { certificationsService } from '@/modules/certifications';
import { RADAR_PERSONAL_QUERY_KEY } from '@/modules/radar-chart';
import { verificationApi } from '../services/document-verification.service';
import { useDeleteCvMutation } from './use-delete-cv-mutation';
import type { CvPreview } from '../types/cv-preview.types';
import type { DocumentVerification } from '../types/document-verification.types';
import type { VerificationDashboardProps } from '../types/verification-dashboard-props.types';
export function useVerificationDashboard({
  rows,
  refresh,
}: VerificationDashboardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [remove, setRemove] = useState<DocumentVerification | null>(null);
  const [preview, setPreview] = useState<CvPreview | null>(null);
  const client = useQueryClient();
  const unread = rows.filter(
    (d) =>
      d.decidedAt &&
      !d.noticeRead &&
      !['review', 'manual_approved', 'manual_rejected'].includes(d.status),
  );
  const latestCv = rows.find((d) => d.active && d.sourceType === 'cv');
  const active = rows.filter(
    (d) =>
      d.active && (d.sourceType === 'certification' || d.id === latestCv?.id),
  );
  const chosen = active.find((d) => d.id === selected) ?? active[0];
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.previewUrl);
    },
    [preview],
  );
  async function changed() {
    await Promise.all([
      refresh(),
      client.invalidateQueries({ queryKey: ['documents', 'cvs'] }),
      client.invalidateQueries({ queryKey: ['certifications'] }),
      client.invalidateQueries({ queryKey: RADAR_PERSONAL_QUERY_KEY }),
    ]);
  }
  const deleteCv = useDeleteCvMutation();
  const previewMutation = useMutation({
    mutationFn: async (doc: DocumentVerification) => ({
      doc,
      file: await verificationApi.file(doc.id),
    }),
    onSuccess: ({ doc: d, file }) => {
      setDetailId(null);
      setPreview({
        file,
        previewUrl: URL.createObjectURL(file),
        cv: {
          id: d.id,
          fileName: d.filename,
          fileType: d.mime,
          updatedAt: new Date(d.createdAt),
          isCurrent: d.active,
          sizeInBytes: d.sizeBytes,
        },
      });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (doc: DocumentVerification) =>
      doc.sourceType === 'cv'
        ? deleteCv.mutateAsync(doc.sourceId)
        : certificationsService.deleteDocument(doc.sourceId, doc.id),
    onSuccess: async () => {
      setRemove(null);
      await changed();
    },
  });
  const acknowledgementMutation = useMutation({
    mutationFn: verificationApi.acknowledge,
    onSuccess: refresh,
  });
  const mutations = [previewMutation, deleteMutation, acknowledgementMutation];
  const busy = mutations.some((mutation) => mutation.isPending);
  const error = previewMutation.isError
    ? 'El documento no está disponible.'
    : deleteMutation.isError
      ? 'No se pudo eliminar el documento. Puedes reintentar.'
      : acknowledgementMutation.isError
        ? 'No se pudo confirmar la lectura del aviso.'
        : '';
  const clearErrors = () => {
    for (const mutation of mutations) mutation.reset();
  };
  const view = (doc: DocumentVerification) => {
    clearErrors();
    previewMutation.mutate(doc);
  };
  const erase = () => {
    if (remove) {
      clearErrors();
      deleteMutation.mutate(remove);
    }
  };
  const acknowledge = (doc: DocumentVerification) => {
    clearErrors();
    acknowledgementMutation.mutate(doc);
  };
  return {
    setSelected,
    historyOpen,
    setHistoryOpen,
    detailId,
    setDetailId,
    remove,
    setRemove,
    preview,
    setPreview,
    busy,
    error,
    unread,
    active,
    chosen,
    view,
    erase,
    acknowledge,
  };
}
