'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell, Check, Eye, FileText, Trash2, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDeleteDialog, formatFileSize } from '@/modules/profile';
import { certificationsService } from '@/modules/certifications';
import { CertificationForm } from '@/modules/certifications/components/certification-form';
import { verificationApi } from '../services/document-verification.service';
import { documentsService } from '../services/documents.service';
import { validateCertificateFile } from '@/modules/certifications/utils/validate-certificate-file';
import { validateCvFile } from '../utils/validate-cv-file';
import { formatUploadDate } from '../utils/format-upload-date';
import { RADAR_PERSONAL_QUERY_KEY } from '@/modules/radar-chart/hooks/use-live-radar';
import { CvViewerDialog } from './cv-viewer-dialog';
import {
  VerificationBadge,
  VerificationDetail,
  VerificationResult,
  VerificationFlow,
} from './verification-result';
import type { CvPreview } from '../types/cv-preview.types';
import {
  verificationLabels,
  type DocumentVerification,
} from '../types/document-verification.types';

export function VerificationDashboard({
  rows,
  refresh,
}: {
  rows: DocumentVerification[];
  refresh: () => Promise<unknown>;
}) {
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
  return (
    <>
      {unread.length > 0 && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 p-3"
        >
          <span>
            {unread[0].filename} · {verificationLabels[unread[0].status]}
            {unread.length > 1
              ? ' · ' + unread.length + ' resultados nuevos'
              : ''}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              void verificationApi
                .acknowledge(unread[0])
                .then(refresh)
                .catch(() =>
                  setError('No se pudo confirmar la lectura del aviso.'),
                )
            }
          >
            Entendido
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-4 rounded-xl border bg-surface p-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">Subir documento o nueva versión</h2>
            <Button onClick={openUpload} disabled={busy}>
              <Upload size={16} /> Subir nueva versión
            </Button>
          </header>
          <ul className="max-h-80 space-y-2 overflow-auto">
            {active.map((d) => (
              <li
                key={d.id}
                className={`flex items-center gap-2 rounded-lg border p-2 ${d.id === chosen?.id ? 'border-blue-400 bg-blue-50/50' : ''}`}
              >
                <FileText className="shrink-0 text-primary" size={20} />
                <Button
                  variant="ghost"
                  className="block h-auto min-w-0 flex-1 text-left whitespace-normal"
                  onClick={() => setSelected(d.id)}
                >
                  <strong className="block break-words">{d.filename}</strong>
                  <small>
                    {formatFileSize(d.sizeBytes)} ·{' '}
                    {formatUploadDate(new Date(d.createdAt))}
                  </small>
                </Button>
                <span className="hidden text-xs sm:block">
                  {d.decidedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">
                      <Check size={14} />
                      Analizado automáticamente
                    </span>
                  ) : (
                    verificationLabels[d.status]
                  )}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={busy || !d.available}
                  aria-label={'Ver ' + d.filename}
                  onClick={() => void view(d)}
                >
                  <Eye />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={busy}
                  aria-label={'Eliminar ' + d.filename}
                  onClick={() => setRemove(d)}
                >
                  <Trash2 className="text-danger" />
                </Button>
              </li>
            ))}
          </ul>
          {!active.length && <p>Todavía no tienes documentos activos.</p>}
          <VerificationResult doc={chosen} details={() => setDetailId(chosen?.id ?? null)} />
        </section>
        <section className="space-y-4 rounded-xl border bg-surface p-4">
          <VerificationFlow doc={chosen} />
          <div className="flex justify-center">
            <Button onClick={() => setHistoryOpen(true)}>
              <Bell size={18} /> Ver historial de verificaciones
            </Button>
          </div>
        </section>
      </div>
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogTitle>Historial de verificaciones</DialogTitle>
          <ul className="max-h-[70vh] divide-y overflow-auto">
            {rows.map((d) => (
              <li key={d.id}>
                <Button
                  variant="ghost"
                  className="grid h-auto w-full grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border p-3 text-left whitespace-normal sm:grid-cols-[auto_1fr_auto_auto]"
                  onClick={() => {
                    setHistoryOpen(false);
                    setDetailId(d.id);
                  }}
                >
                  <FileText aria-hidden="true" className="text-primary" />
                  <span className="min-w-0">
                    <strong className="block break-words">{d.filename}</strong>
                    <small>
                      {d.mime.split('/').at(-1)?.toUpperCase()} ·{' '}
                      {formatFileSize(d.sizeBytes)}
                    </small>
                  </span>
                  <VerificationBadge doc={d} />
                  <small className="col-span-full text-right sm:col-span-1">
                    {formatUploadDate(new Date(d.decidedAt ?? d.createdAt))}
                  </small>
                </Button>
              </li>
            ))}
          </ul>
          {!rows.length && <p>Aún no hay verificaciones.</p>}
          <div className="flex justify-end">
            <Button onClick={() => setHistoryOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
      <VerificationDetail
        doc={rows.find((row) => row.id === detailId) ?? null}
        close={() => setDetailId(null)}
        view={(d) => void view(d)}
      />
      <CvViewerDialog preview={preview} onClose={() => setPreview(null)} />
      <ConfirmDeleteDialog
        isOpen={!!remove}
        title={
          remove?.sourceType === 'cv'
            ? '¿Eliminar este CV?'
            : '¿Eliminar este documento?'
        }
        message={
          remove?.filename +
          ' dejará de estar disponible en tu perfil. Se conservará el historial de verificación.'
        }
        isDeleting={busy}
        onCancel={() => setRemove(null)}
        onConfirm={() => void erase()}
      />
      <Dialog
        open={upload}
        onOpenChange={(v) => {
          if (!busy) setUpload(v);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogTitle>Subir nueva versión</DialogTitle>
          <label>
            Tipo de documento{' '}
            <NativeSelect
              className="rounded border p-2"
              aria-label="Tipo de documento"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <NativeSelectOption value="cv">Currículum</NativeSelectOption>
              <NativeSelectOption value="certification">
                Certificación
              </NativeSelectOption>
            </NativeSelect>
          </label>
          {mode === 'certification' && (
            <label>
              Certificación{' '}
              <NativeSelect
                className="rounded border p-2"
                aria-label="Certificación"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <NativeSelectOption value="">
                  Nueva certificación
                </NativeSelectOption>
                {certs.map((d) => (
                  <NativeSelectOption key={d.id} value={d.id}>
                    {d.filename}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          )}
          {mode === 'certification' && !target ? (
            <CertificationForm
              onCancel={() => setUpload(false)}
              onSubmit={async (values, change) => {
                if (change.type !== 'replace')
                  return 'Adjunta el respaldo de la certificación.';
                try {
                  await certificationsService.createWithDocument(
                    values,
                    change.file,
                  );
                  setUpload(false);
                  setSelected(null);
                  await changed();
                  return null;
                } catch {
                  return 'No se pudo guardar la certificación.';
                }
              }}
            />
          ) : (
            <>
              <p>
                {mode === 'cv'
                  ? 'El PDF más reciente será tu CV vigente. Las versiones anteriores se conservan.'
                  : 'Adjunta un PDF, JPG o PNG de hasta 5 MB.'}
              </p>
              <Input
                hidden
                type="file"
                ref={fileInput}
                accept={mode === 'cv' ? '.pdf' : '.pdf,.jpg,.jpeg,.png'}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) void saveFile(f);
                }}
              />
              <Button
                disabled={busy}
                onClick={() => fileInput.current?.click()}
              >
                {busy ? 'Subiendo…' : 'Seleccionar archivo'}
              </Button>
            </>
          )}
          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
