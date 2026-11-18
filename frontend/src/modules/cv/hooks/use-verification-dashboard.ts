'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  certificationsService,
  useCreateCertification,
  validateCertificateFile,
  type CertificationFormProps,
} from '@/modules/certifications';
import { RADAR_PERSONAL_QUERY_KEY } from '@/modules/radar-chart';
import { verificationApi } from '../services/document-verification.service';
import { useCvMutations } from './use-cv-mutations';
import { validateCvFile } from '../utils/validate-cv-file';
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
  const [upload, setUpload] = useState(false);
  const [mode, setMode] = useState('cv');
  const [target, setTarget] = useState('');
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
  const certs = active.filter((d) => d.sourceType === 'certification');
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
  const cvMutations = useCvMutations();
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
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const problem =
        mode === 'cv' ? validateCvFile(file) : validateCertificateFile(file);
      if (problem) throw new Error(problem);
      if (mode === 'cv') return cvMutations.uploadMutation.mutateAsync(file);
      const version = certs.find((doc) => doc.id === target);
      if (!version)
        throw new Error(
          'La versión seleccionada cambió. Selecciona el documento vigente.',
        );
      return certificationsService.uploadDocument(
        version.sourceId,
        file,
        version.id,
      );
    },
    onSuccess: async () => {
      setUpload(false);
      setSelected(null);
      await changed();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (doc: DocumentVerification) =>
      doc.sourceType === 'cv'
        ? cvMutations.deleteMutation.mutateAsync(doc.sourceId)
        : certificationsService.deleteDocument(doc.sourceId, doc.id),
    onSuccess: async () => {
      setRemove(null);
      await changed();
    },
  });
  const creation = useCreateCertification({
    onSuccess: async () => {
      setUpload(false);
      setSelected(null);
      await changed();
    },
  });
  const acknowledgementMutation = useMutation({
    mutationFn: verificationApi.acknowledge,
    onSuccess: refresh,
  });
  const mutations = [
    previewMutation,
    uploadMutation,
    deleteMutation,
    creation,
    acknowledgementMutation,
  ];
  const busy = mutations.some((mutation) => mutation.isPending);
  const error = previewMutation.isError
    ? 'El documento no está disponible.'
    : uploadMutation.isError
      ? uploadMutation.error instanceof Error &&
        !('response' in uploadMutation.error)
        ? uploadMutation.error.message
        : 'No se pudo subir el archivo. Comprueba el formato y el máximo de 5 MB.'
      : deleteMutation.isError
        ? 'No se pudo eliminar el documento. Puedes reintentar.'
        : creation.error
          ? 'No se pudo guardar la certificación.'
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
  const saveFile = (file: File) => {
    clearErrors();
    uploadMutation.mutate(file);
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
  const openUpload = () => {
    clearErrors();
    setUpload(true);
    setMode(chosen?.active ? chosen.sourceType : 'cv');
    setTarget(
      chosen?.sourceType === 'certification' && chosen.active ? chosen.id : '',
    );
  };
  const createCertification: CertificationFormProps['onSubmit'] = async (
    values,
    change,
  ) => {
    if (change.type !== 'replace')
      return 'Adjunta el respaldo de la certificación.';
    clearErrors();
    try {
      await creation.mutateAsync({ data: values, document: change.file });
      return null;
    } catch {
      return 'No se pudo guardar la certificación.';
    }
  };
  return {
    selected,
    setSelected,
    historyOpen,
    setHistoryOpen,
    detailId,
    setDetailId,
    upload,
    setUpload,
    mode,
    setMode,
    target,
    setTarget,
    remove,
    setRemove,
    preview,
    setPreview,
    busy,
    error,
    unread,
    active,
    certs,
    chosen,
    view,
    saveFile,
    erase,
    openUpload,
    createCertification,
    acknowledge,
  };
}
