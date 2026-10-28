'use client';

import type { ProposalCoverFieldProps } from '../types/proposal-cover-field-props.types';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Upload, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PROPOSAL_COVER_ACCEPT } from '../constants/proposal.constants';
import { readProposalCover } from '../utils/read-proposal-cover';
import { ProposalField } from './proposal-field';

export function ProposalCoverField({ value, onChange, error, disabled, onBusyChange }: ProposalCoverFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState<string>();
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
        className={`relative flex w-full flex-col items-center gap-6 overflow-hidden rounded-xl border border-dashed p-6 transition-colors sm:flex-row sm:p-8 ${dragging ? 'border-accent bg-availability' : message ? 'border-danger bg-brand-soft/30' : 'border-border bg-surface-soft'}`}
        onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); void selectFiles(Array.from(event.dataTransfer.files)); }}
      >
        <div className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-availability/50" />

        <div className="group relative z-10 flex h-[120px] w-[200px] shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface-soft shadow-sm">
          {value ? (
            <>
              <Image src={value.previewUrl} alt="Vista previa" fill unoptimized sizes="200px" className="rounded-lg object-cover" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => { setFileError(undefined); onChange(null); }}
                disabled={disabled || busy}
                className="absolute -top-2 -right-2 z-20 size-7 rounded-full border border-border bg-surface text-text-secondary shadow-md transition hover:bg-brand-soft hover:text-danger disabled:opacity-50"
                aria-label="Quitar imagen de portada"
              >
                <X className="size-3.5" />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-text-secondary">
              <ImagePlus className="size-8" />
              <span className="text-[11px] font-bold tracking-widest uppercase">Vista Previa</span>
            </div>
          )}
        </div>

        <div className="z-10 min-w-0 flex-1 space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-availability/80 px-3 py-1 text-[11px] font-bold tracking-wide text-accent uppercase">
            <Sparkles className="size-3" /> Imagen de portada
          </div>
          <h3 className="text-[17px] font-bold text-ink">Dale una identidad a tu taller</h3>
          <p className="max-w-lg text-sm text-text-secondary">Elige una imagen que represente el tema. Se mostrará en la tarjeta del taller y en su ficha de detalles.</p>
          
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-text-secondary sm:justify-start">
            <span className="rounded-md bg-surface-soft/80 px-2.5 py-1">JPG / PNG</span>
            <span className="rounded-md bg-surface-soft/80 px-2.5 py-1">Máx. 5 MB</span>
            <span className="rounded-md bg-surface-soft/80 px-2.5 py-1">1200 × 600 px</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 sm:justify-start">
            <Button type="button" variant="outline" disabled={disabled || busy} onClick={() => input.current?.click()} className="bg-surface hover:bg-surface-soft">
              <Upload className="mr-2 size-4" />
              {busy ? 'Comprobando...' : 'Seleccionar imagen'}
            </Button>
            <span className="text-xs text-text-secondary">o arrastra y suelta una imagen aquí</span>
          </div>
          
          <Input ref={input} id="proposal-cover" type="file" accept={PROPOSAL_COVER_ACCEPT} className="sr-only" disabled={disabled || busy}
            onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ''; if (files.length) void selectFiles(files); }} />
        </div>
      </div>
      
      {message && (
        <p id="proposal-cover-error" role="alert" className="mt-2 text-sm text-danger">
          {message}
        </p>
      )}
      {value && <p className="mt-2 text-xs text-text-secondary">{value.file.name}</p>}
      <p className="mt-1 text-xs text-text-secondary">Recomendado: imagen horizontal relacionada con el contenido del taller.</p>
      {busy && <p role="status" className="mt-2 text-xs text-accent">Comprobando que la imagen se pueda visualizar...</p>}
    </ProposalField>
  );
}