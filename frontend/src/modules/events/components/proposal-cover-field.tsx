'use client';

import type { ProposalCoverFieldProps } from '../types/proposal-cover-field-props.types';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Upload, X, Expand, FileImage, HardDrive, Ratio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PROPOSAL_COVER_ACCEPT } from '../constants/proposal.constants';
import { readProposalCover } from '../utils/read-proposal-cover';
import { ProposalField } from './proposal-field';

export function ProposalCoverField({ value, onChange, error, disabled, onBusyChange }: ProposalCoverFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState<string>();
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => { request.current += 1; }, []);

  async function selectFiles(files: File[]) {
    if (disabled) return;
    const current = ++request.current;
    setFileError(undefined);
    if (files.length !== 1) { setFileError('Selecciona una sola imagen para la portada.'); setBusy(false); onBusyChange(false); return; }
    setBusy(true); onBusyChange(true);
    try {
      const cover = await readProposalCover(files[0]);
      if (current !== request.current) { URL.revokeObjectURL(cover.previewUrl); return; }
      onChange(cover);
    } catch (cause) {
      if (current === request.current) setFileError(cause instanceof Error ? cause.message : 'No se pudo leer la imagen.');
    } finally {
      if (current === request.current) { setBusy(false); onBusyChange(false); }
    }
  }

  const message = fileError ?? error;

  return (
    <ProposalField id="proposal-cover" label="Imagen de portada del taller">
      <div 
        className={`@container w-full min-w-0 rounded-xl border p-3 ${dragging ? 'border-accent bg-availability' : message ? 'border-danger bg-brand-soft/30' : 'border-availability-border/40 bg-availability/40'}`}
        onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); void selectFiles(Array.from(event.dataTransfer.files)); }}
      >

        <div className="grid min-w-0 grid-cols-1 items-center gap-4 @min-[36rem]:grid-cols-[200px_minmax(0,1fr)]">
        <div className="relative mx-auto flex aspect-workshop-cover w-full max-w-[200px] items-center justify-center rounded-lg border border-availability-border/40 bg-surface shadow-sm">
          {value ? (
            <>
              <Button type="button" variant="ghost" onClick={() => setExpanded(true)} aria-label="Ampliar imagen de portada" aria-haspopup="dialog" className="group absolute inset-0 size-full cursor-zoom-in overflow-hidden rounded-lg border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                <Image src={value.previewUrl} alt="Vista previa de la portada" fill unoptimized sizes="200px" className="object-cover" />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-accent/85 py-1.5 text-xs font-medium text-white transition-colors group-hover:bg-accent group-focus-visible:bg-accent"><Expand className="size-3.5" aria-hidden="true" />Ampliar imagen</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => { setExpanded(false); setFileError(undefined); onChange(null); }}
                disabled={disabled || busy}
                className="absolute top-1 right-1 z-20 size-11 rounded-full border border-border bg-surface text-text-secondary shadow-md transition hover:bg-brand-soft hover:text-danger disabled:opacity-50"
                aria-label="Quitar imagen de portada"
              >
                <X className="size-3.5" />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-accent">
              <ImagePlus className="size-8" aria-hidden="true" />
              <span className="text-xs font-medium">Vista Previa</span>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-3 text-left">
          <div className="min-w-0 space-y-1.5">
            <p className="text-sm font-semibold text-ink">Dale una identidad a tu taller</p>
            <p className="text-sm text-text-secondary">Elige una imagen que represente el tema. Se mostrará en la tarjeta del taller y en su ficha de detalles.</p>
            <div id="proposal-cover-help" className="flex min-w-0 flex-wrap justify-start gap-1.5 text-xs font-medium text-accent">
              <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border border-availability-border/25 bg-surface px-1.5 py-0.5"><FileImage className="size-3" aria-hidden="true" />JPG / PNG</span>
              <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border border-availability-border/25 bg-surface px-1.5 py-0.5"><HardDrive className="size-3" aria-hidden="true" />Máx. 2 MB</span>
              <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border border-availability-border/25 bg-surface px-1.5 py-0.5"><Ratio className="size-3 shrink-0" aria-hidden="true" /><span className="min-w-0 wrap-anywhere">1200 × 600 px</span></span>
            </div>
            {value && <p className="text-xs wrap-anywhere text-text-secondary">{value.file.name}</p>}
          </div>
          <div className="flex min-w-0 flex-col items-stretch gap-2 @min-[36rem]:flex-row @min-[36rem]:flex-wrap @min-[36rem]:items-center">
            <Button type="button" variant="outline" disabled={disabled || busy} onClick={() => input.current?.click()} className="min-h-11 w-full min-w-0 border-availability-border/60 bg-surface text-accent hover:bg-availability hover:text-accent focus-visible:bg-availability active:bg-availability @min-[36rem]:w-auto"
              aria-describedby={`proposal-cover-help proposal-cover-recommendation${message ? ' proposal-cover-error' : ''}`} aria-invalid={Boolean(message)}>
              <Upload className="size-4" aria-hidden="true" />
              {busy ? 'Comprobando...' : value ? 'Cambiar imagen' : 'Seleccionar imagen'}
            </Button>
            <span className="hidden text-xs text-text-secondary @min-[36rem]:block">o arrastra y suelta una imagen aquí</span>
          </div>

          <Input ref={input} id="proposal-cover" type="file" accept={PROPOSAL_COVER_ACCEPT} className="sr-only" tabIndex={-1} disabled={disabled || busy}
            onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ''; if (files.length) void selectFiles(files); }} />
        </div>
        </div>
      </div>
      
      <p id="proposal-cover-recommendation" className="text-xs text-text-secondary">Recomendado: imagen horizontal de 1200 × 600 px, relacionada con el contenido del taller.</p>
      {message && (
        <p id="proposal-cover-error" role="alert" className="mt-2 text-sm text-danger">
          {message}
        </p>
      )}
      <Dialog open={expanded && Boolean(value)} onOpenChange={setExpanded}>
        <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader className="pr-12">
            <DialogTitle>Vista previa de la portada</DialogTitle>
            <DialogDescription className="wrap-anywhere">{value?.file.name}</DialogDescription>
          </DialogHeader>
          <DialogClose render={<Button type="button" variant="ghost" size="icon-lg" className="absolute top-2 right-2 text-accent" aria-label="Cerrar vista previa" />}><X aria-hidden="true" /></DialogClose>
          {value && <div className="relative h-[60dvh] min-h-40 overflow-hidden rounded-lg border border-availability-border/30 bg-availability/40">
            <Image src={value.previewUrl} alt="Portada completa del taller" fill unoptimized sizes="(max-width: 640px) 90vw, 850px" className="object-contain" />
          </div>}
          <p className="text-xs text-text-secondary">Imagen completa, sin recorte. La tarjeta del taller puede mostrar un recorte para ajustarse a su formato.</p>
        </DialogContent>
      </Dialog>
      {busy && <p role="status" className="mt-2 text-xs text-accent">Comprobando que la imagen se pueda visualizar...</p>}
    </ProposalField>
  );
}