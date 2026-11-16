'use client';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  certificationsService,
  validateCertificateFile,
  type CertificationFormProps,
} from '@/modules/certifications';
import { RADAR_PERSONAL_QUERY_KEY } from '@/modules/radar-chart';
import { documentsService } from '../services/documents.service';
import { verificationApi } from '../services/document-verification.service';
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const client = useQueryClient();
  const unread = rows.filter(
    (d) =>
      d.decidedAt &&
      !d.noticeRead &&
      !['review', 'manual_approved', 'manual_rejected'].includes(d.status),
  );
  const fileInput = useRef<HTMLInputElement>(null);
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
  async function view(d: DocumentVerification) {
    setError('');
    setBusy(true);
    try {
      const file = await verificationApi.file(d.id);
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
    } catch {
      setError('El documento no está disponible.');
    } finally {
      setBusy(false);
    }
  }
  async function saveFile(file: File) {
    const problem =
      mode === 'cv' ? validateCvFile(file) : validateCertificateFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (mode === 'cv') await documentsService.uploadCv(file);
      else {
        const version = certs.find((d) => d.id === target);
        if (!version) {
          setError(
            'La versión seleccionada cambió. Selecciona el documento vigente.',
          );
          return;
        }
        await certificationsService.uploadDocument(
          version.sourceId,
          file,
          version.id,
        );
      }
      setUpload(false);
      setSelected(null);
      await changed();
    } catch {
      setError(
        'No se pudo subir el archivo. Comprueba el formato y el máximo de 5 MB.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function erase() {
    if (!remove) return;
    setError('');
    setBusy(true);
    try {
      if (remove.sourceType === 'cv')
        await documentsService.deleteCv(remove.sourceId);
      else
        await certificationsService.deleteDocument(remove.sourceId, remove.id);
      setRemove(null);
      await changed();
    } catch {
      setError('No se pudo eliminar el documento. Puedes reintentar.');
    } finally {
      setBusy(false);
    }
  }
  const openUpload = () => {
    setUpload(true);
    setMode(chosen?.active ? chosen.sourceType : 'cv');
    setTarget(
      chosen?.sourceType === 'certification' && chosen.active ? chosen.id : '',
    );
    setError('');
  };
  async function acknowledge() {
    if (!unread[0]) return;
    try {
      await verificationApi.acknowledge(unread[0]);
      await refresh();
    } catch {
      setError('No se pudo confirmar la lectura del aviso.');
    }
  }
  const createCertificate: CertificationFormProps['onSubmit'] = async (
    values,
    change,
  ) => {
    if (change.type !== 'replace')
      return 'Adjunta el respaldo de la certificación.';
    try {
      await certificationsService.createWithDocument(values, change.file);
      setUpload(false);
      setSelected(null);
      await changed();
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
    fileInput,
    unread,
    active,
    certs,
    chosen,
    view,
    saveFile,
    erase,
    openUpload,
    acknowledge,
    createCertificate,
  };
}
