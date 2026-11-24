'use client';
import { Bell, Eye, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDeleteDialog, formatFileSize } from '@/modules/profile';
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
  const {
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
  } = useVerificationDashboard({ rows, refresh });
  return (
    <>
      {unread.length > 0 && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-soft p-3"
        >
          <span className="min-w-0 [overflow-wrap:anywhere]">
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
      <div className="flex flex-col gap-5">
        <section className="space-y-4 rounded-xl border bg-surface p-4">
          <ul className="max-h-80 space-y-2 overflow-auto">
            {active.map((d) => (
              <li
                key={d.id}
                className={cn(
                  'grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg border p-2',
                  d.id === chosen?.id && 'border-accent bg-surface-soft',
                )}
              >
                <FileText className="shrink-0 text-primary" size={20} />
                <Button
                  variant="ghost"
                  className="block h-auto min-w-0 flex-1 text-left whitespace-normal"
                  onClick={() => setSelected(d.id)}
                >
                  <strong className="block [overflow-wrap:anywhere]">
                    {d.filename}
                  </strong>
                  <small>
                    {formatFileSize(d.sizeBytes)} ·{' '}
                    {formatUploadDate(new Date(d.createdAt))}
                  </small>
                </Button>
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
                <span className="col-span-full min-w-0 text-xs">
                  <VerificationBadge doc={d} />
                </span>
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
            <Button
              className="h-auto max-w-full whitespace-normal"
              onClick={() => setHistoryOpen(true)}
            >
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
                  className="grid h-auto w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg border p-3 text-left whitespace-normal sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                  onClick={() => {
                    setHistoryOpen(false);
                    setDetailId(d.id);
                  }}
                >
                  <FileText aria-hidden="true" className="text-primary" />
                  <span className="min-w-0">
                    <strong className="block [overflow-wrap:anywhere]">
                      {d.filename}
                    </strong>
                    <small>
                      {d.mime.split('/').at(-1)?.toUpperCase()} ·{' '}
                      {formatFileSize(d.sizeBytes)}
                    </small>
                  </span>
                  <span className="col-span-full sm:col-span-1">
                    <VerificationBadge doc={d} />
                  </span>
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
    </>
  );
}
