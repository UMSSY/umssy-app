'use client';

import type { ProposalReviewDialogProps } from '../types/proposal-review-dialog-props.types';
import Image from 'next/image';
import { useRef } from 'react';
import { CalendarDays, Clock, Info, Loader2, MapPin, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatProposalDate, formatProposalDuration, formatProposalTime } from '../utils/proposal-format';

export function ProposalReviewDialog({ open, values, cover, tutor, category, pending, unavailable, error, onClose, onConfirm }: ProposalReviewDialogProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !pending) onClose(); }}>
      <DialogContent initialFocus={headingRef} showCloseButton={false} className="max-h-editor-dialog overflow-y-auto p-5 sm:max-w-md" aria-busy={pending}>
        <DialogHeader><DialogTitle ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-ink">Revisar propuesta</DialogTitle>
          <DialogDescription>Comprueba la información antes de enviarla.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <article className="overflow-hidden rounded-lg border border-border bg-surface">
            {cover && (
              <div className="relative h-48 w-full bg-surface-soft">
                <Image 
                  src={cover.previewUrl} 
                  alt="Portada de la propuesta a confirmar" 
                  fill 
                  unoptimized 
                  sizes="448px" 
                  className="object-cover object-center" 
                />
              </div>
            )}
            <div className="space-y-3 p-4">
              <span className="inline-block rounded-full bg-interaction px-3 py-1 text-xs text-ink">{category}</span>
              <h3 className="text-lg font-semibold wrap-anywhere text-ink">{values.title}</h3>
              <p className="text-sm text-text-secondary">Modalidad: {values.modality === 'virtual' ? 'Virtual' : 'Presencial'}</p>
              <dl className="space-y-2 text-sm text-text-secondary">
                {[[CalendarDays, 'Fecha del taller', formatProposalDate(values.eventDate)], [Clock, 'Horario', `${formatProposalTime(values.startTime)} – ${formatProposalTime(values.endTime)}`], [MapPin, values.modality === 'virtual' ? 'Enlace' : 'Ubicación', values.location], [UserRound, 'Tutor', tutor]].map(([Icon, label, value]) => {
                  const RowIcon = Icon as typeof Clock;
                  return <div key={String(label)} className="flex gap-2"><dt><RowIcon className="size-4" aria-hidden="true" /><span className="sr-only">{String(label)}</span></dt><dd className="min-w-0 wrap-anywhere">{String(value)}</dd></div>;
                })}
              </dl>
              <p className="text-xs text-text-secondary">Duración: {formatProposalDuration(values.startTime, values.endTime)}</p>
              <div className="space-y-2 border-t border-border pt-3"><h4 className="text-xs font-semibold text-ink">DESCRIPCIÓN</h4><p className="text-sm wrap-anywhere whitespace-pre-wrap text-text-secondary">{values.description}</p></div>
              <p className="flex justify-between gap-2 text-sm text-ink"><span>Cupo máximo</span><strong>{values.capacity} participantes</strong></p>
            </div>
          </article>
          <div className="flex gap-3 rounded-lg border border-availability-border bg-availability p-4">
            <Info className="size-5 shrink-0 text-availability-foreground" aria-hidden="true" />
            <div className="space-y-1"><p className="text-sm font-semibold text-ink">Tu propuesta quedará en votación</p>
              <p className="text-sm text-text-secondary">Necesita {Math.max(8, Math.ceil(Number(values.capacity) / 2))} apoyos: el 50 % del cupo, con un mínimo de 8. La votación dura 10 días desde el envío.</p></div>
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          {unavailable && <p role="alert" className="text-sm text-danger">No se pudo verificar la sesión o los datos del formulario. Vuelve al formulario para revisarlos.</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancelar</Button>
          <Button type="button" disabled={pending || unavailable} onClick={onConfirm}>{pending && <Loader2 className="animate-spin" aria-hidden="true" />}{pending ? 'Enviando…' : 'Confirmar'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}