import { Check, Eye, FileText, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { formatFileSize } from '../utils/format-file-size';

interface UploadedDocumentCardProps {
  fileName: string;
  fileSize: number;
  progress: number;
  isUploading: boolean;
  isRemoving: boolean;
  onView: () => void;
  onRemove: () => void;
}

export function UploadedDocumentCard({
  fileName,
  fileSize,
  progress,
  isUploading,
  isRemoving,
  onView,
  onRemove,
}: UploadedDocumentCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 shrink-0 text-slate-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{fileName}</p>
          <p className="text-xs text-slate-500">{formatFileSize(fileSize)}</p>
        </div>

        {isUploading ? (
          <span className="text-xs text-slate-500">{progress} %</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <Check className="h-3 w-3" />
              Listo
            </span>
            <Button type="button" variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4" />
              Ver
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemove}
              disabled={isRemoving}
            >
              <X className="h-4 w-4" />
              Quitar
            </Button>
          </div>
        )}
      </div>

      {isUploading && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
        >
          <div
            className="h-full bg-slate-900 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}