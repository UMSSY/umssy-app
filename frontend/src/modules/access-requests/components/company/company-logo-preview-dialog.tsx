'use client';

import { RefreshCw, Trash2, X } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { formatCompanyFileSize } from '../../utils/format-company-file-size';
import type { CompanyLogoPreviewDialogProps } from '../../types/company-logo-preview-dialog-props.types';

export function CompanyLogoPreviewDialog({
  open,
  logoFile,
  logoPreview,
  logoDimensions,
  previewBg,
  logoInputRef,
  onChangeBg,
  onClose,
  onRemoveLogo,
}: CompanyLogoPreviewDialogProps) {
  if (!open || !logoFile || !logoPreview) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logo-preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3
              id="logo-preview-modal-title"
              className="text-base font-bold text-ink"
            >
              Vista previa del logo corporativo
            </h3>
            <p className="text-xs text-text-secondary">
              {logoFile.name} · {formatCompanyFileSize(logoFile.size)}
              {logoDimensions
                ? ` · ${logoDimensions.width} × ${logoDimensions.height} px`
                : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            aria-label="Cerrar vista previa"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-secondary transition hover:bg-surface-soft hover:text-ink"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">
              Contraste de visualización:
            </span>
            <div className="inline-flex rounded-lg border border-border bg-surface-soft p-0.5 text-xs">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => onChangeBg('light')}
                className={cn(
                  'rounded-md px-2.5 py-1 font-medium transition',
                  previewBg === 'light'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-text-secondary hover:text-ink',
                )}
              >
                Fondo claro
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => onChangeBg('dark')}
                className={cn(
                  'rounded-md px-2.5 py-1 font-medium transition',
                  previewBg === 'dark'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-text-secondary hover:text-ink',
                )}
              >
                Fondo oscuro
              </Button>
            </div>
          </div>

          <div
            className={cn(
              'flex h-64 items-center justify-center rounded-xl border border-border p-6 transition-colors',
              previewBg === 'light' ? 'bg-white' : 'bg-slate-900',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPreview}
              alt="Vista previa ampliada del logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-soft/50 px-5 py-3.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemoveLogo}
            className="gap-1.5 text-danger hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="size-4" />
            Retirar logo
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              className="gap-1.5"
            >
              <RefreshCw className="size-4" />
              Cambiar imagen
            </Button>
            <Button type="button" size="sm" onClick={onClose}>
              Listo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
