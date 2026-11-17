'use client';
import { useId, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Bell, Check, Eye, FileText, Trash2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDeleteDialog, formatFileSize } from '@/modules/profile';
import { CertificationForm } from '@/modules/certifications';
import { formatUploadDate } from '../utils/format-upload-date';
import { CvViewerDialog } from './cv-viewer-dialog';
import {
  VerificationBadge,
  VerificationDetail,
  VerificationResult,
  VerificationFlow,
} from './verification-result';
import { verificationLabels } from '../constants/verification-labels.constants';
import { useVerificationDashboard } from '../hooks/use-verification-dashboard';
import type { VerificationDashboardProps } from '../types/verification-dashboard-props.types';
import { cn } from '@/lib/utils';

export function VerificationDashboard({
  rows,
  refresh,
}: VerificationDashboardProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const documentTypeId = useId();
  const certificationId = useId();
  const {
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
  } = useVerificationDashboard({ rows, refresh });
  return (
    <>
      {unread.length > 0 && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg bg-surface-soft p-3"
        >
          <span>
            {unread[0].filename} · {verificationLabels[unread[0].status]}
            {unread.length > 1
              ? ' · ' + unread.length + ' resultados nuevos'
              : ''}
          </span>
          <Button variant="outline" onClick={() => void acknowledge(unread[0])}>
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
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-2',
                  d.id === chosen?.id && 'border-accent bg-surface-soft',
                )}
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
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-soft px-2 py-1 text-accent">
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
          <VerificationResult
            doc={chosen}
            details={() => setDetailId(chosen?.id ?? null)}
          />
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
          <div className="space-y-2">
            <Label htmlFor={documentTypeId}>Tipo de documento</Label>
            <NativeSelect
              id={documentTypeId}
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
          </div>
          {mode === 'certification' && (
            <div className="space-y-2">
              <Label htmlFor={certificationId}>Certificación</Label>
              <NativeSelect
                id={certificationId}
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
            </div>
          )}
          {mode === 'certification' && !target ? (
            <CertificationForm
              onCancel={() => setUpload(false)}
              onSubmit={createCertification}
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
