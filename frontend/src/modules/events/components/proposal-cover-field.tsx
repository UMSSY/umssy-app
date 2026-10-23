'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PROPOSAL_COVER_ACCEPT } from '../constants/proposal.constants';
import type { ProposalCover } from '../types/proposal.types';
import { readProposalCover } from '../utils/read-proposal-cover';
import { ProposalField } from './proposal-field';

export function ProposalCoverField({ value, onChange, error, disabled, onBusyChange }: {
  value: ProposalCover | null; onChange: (value: ProposalCover | null) => void;
  error?: string; disabled?: boolean; onBusyChange: (busy: boolean) => void;
}) {
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
    <ProposalField id="proposal-cover" label="Portada del taller" error={message}>
        <div className={`relative flex flex-col items-center justify-center gap-5 rounded-lg border border-dashed p-5 text-center sm:flex-row ${dragging ? 'border-accent bg-interaction' : 'border-border-strong bg-surface-soft'}`}
          onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void selectFiles(Array.from(event.dataTransfer.files)); }}>
          <div className="relative flex h-28 w-48 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-interaction">
            {value ? <Image src={value.previewUrl} alt="Vista previa de la portada del taller" fill unoptimized sizes="192px" className="object-cover" /> : <ImagePlus className="size-8 text-text-secondary" aria-label="Previsualización de la portada" />}
          </div>
          <div className="min-w-0 space-y-3">
          <p className="text-sm font-semibold text-ink">Sube una imagen representativa</p>
          <p id="proposal-cover-help" className="text-xs text-text-secondary">JPG o PNG, hasta 5 MB. Recomendado: 1200 × 600 px.</p>
          <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" disabled={disabled || busy} onClick={() => input.current?.click()}>
            <Upload aria-hidden="true" />{busy ? 'Comprobando imagen…' : value ? 'Cambiar imagen' : 'Seleccionar imagen'}
          </Button>
          {value && <Button type="button" variant="ghost" disabled={disabled || busy} onClick={() => { setFileError(undefined); onChange(null); }}><X aria-hidden="true" />Quitar</Button>}
          </div>
          <Input ref={input} id="proposal-cover" type="file" accept={PROPOSAL_COVER_ACCEPT} className="sr-only top-0 left-0 size-px p-0" disabled={disabled || busy}
            aria-required="true" aria-invalid={Boolean(message)} aria-describedby={`proposal-cover-help${message ? ' proposal-cover-error' : ''}`}
            onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ''; if (files.length) void selectFiles(files); }} />
          <p className="text-xs wrap-anywhere text-text-secondary">{value ? value.file.name : 'También puedes arrastrar la imagen aquí.'}</p>
          </div>
        </div>
      {busy && <p role="status" className="text-xs text-text-secondary">Comprobando que la imagen se pueda visualizar…</p>}
    </ProposalField>
  );
}
