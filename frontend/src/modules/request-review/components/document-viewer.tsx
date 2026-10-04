'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Download, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

interface DocumentViewerProps {
  url: string;
  mimeType: string;
  fileName: string;
}

export function DocumentViewer({ url, mimeType, fileName }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const isPdf = mimeType === 'application/pdf';
  const zoomPercent = Math.round(zoom * 100);

  function handleZoomIn() {
    setZoom((current) => Math.min(current + ZOOM_STEP, MAX_ZOOM));
  }

  function handleZoomOut() {
    setZoom((current) => Math.max(current - ZOOM_STEP, MIN_ZOOM));
  }

  function handleRotate() {
    setRotation((current) => (current + 90) % 360);
  }

  return (
    <div className="flex min-h-[480px] flex-col overflow-hidden rounded-lg bg-slate-900">
      <div className="flex items-center justify-between gap-2 border-b border-slate-700 px-4 py-2">
        <p className="min-w-0 truncate text-sm text-slate-200">{fileName}</p>

        <div className="flex items-center gap-2">
          {!isPdf && (
            <span className="text-xs text-slate-300">{`${zoomPercent} %`}</span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Acercar"
            disabled={isPdf || zoom >= MAX_ZOOM}
            onClick={handleZoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Alejar"
            disabled={isPdf || zoom <= MIN_ZOOM}
            onClick={handleZoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Rotar"
            disabled={isPdf}
            onClick={handleRotate}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <a
            href={url}
            download={fileName}
            aria-label="Descargar documento"
            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-600 px-2.5 text-[0.8rem] text-slate-100 hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Descargar
          </a>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {isPdf ? (
          // El PDF usa el visor integrado del navegador
          <object
            data={url}
            type="application/pdf"
            aria-label={`Documento ${fileName}`}
            className="h-full min-h-[420px] w-full"
          >
            <p className="p-4 text-sm text-slate-300">
              No se puede mostrar el PDF. Usa el botón Descargar.
            </p>
          </object>
        ) : (
          <div
            data-testid="viewer-canvas"
            className="relative h-full min-h-[420px] w-full transition-transform"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
          >
            {/* unoptimized: las URL de objeto (blob:) no pasan por el optimizador de Next */}
            <Image
              src={url}
              alt={`Documento de respaldo: ${fileName}`}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
