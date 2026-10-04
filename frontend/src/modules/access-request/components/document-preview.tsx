import Image from 'next/image';

interface DocumentPreviewProps {
  url: string;
  mimeType: string;
  fileName: string;
}

export function DocumentPreview({ url, mimeType, fileName }: DocumentPreviewProps) {
  if (mimeType === 'application/pdf') {
    return (
      <object
        data={url}
        type="application/pdf"
        aria-label={`Vista previa de ${fileName}`}
        className="h-96 w-full rounded-md border border-slate-200"
      >
        <p className="p-4 text-sm text-slate-500">
          No se puede mostrar la vista previa. Usa el botón Ver.
        </p>
      </object>
    );
  }

  // unoptimized: las URL de objeto (blob:) no pasan por el optimizador de Next
  return (
    <div className="relative h-96 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50">
      <Image
        src={url}
        alt={`Vista previa de ${fileName}`}
        fill
        unoptimized
        className="object-contain"
      />
    </div>
  );
}