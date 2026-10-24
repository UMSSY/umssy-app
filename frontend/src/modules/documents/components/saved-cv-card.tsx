import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SavedCvCardProps } from "../types/saved-cv-card-props.types";
import { formatFileSize } from "@/modules/profile";
import { formatUploadDate } from "../utils/format-upload-date";
import { SectionCard } from "@/modules/profile";
import { DangerZone } from "@/shared/components/layout/danger-zone";

export function SavedCvCard({
  savedCv,
  isLoading = false,
  isBusy = false,
  onReplace,
  onDelete,
}: SavedCvCardProps) {
  if (isLoading) {
    return (
      <SectionCard title="Archivo guardado">
        <div aria-busy="true" className="flex flex-col gap-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <span className="sr-only">Cargando tu CV...</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Archivo guardado">
      {savedCv ? (
        <div>
          <p className="text-base font-bold break-words text-ink">{savedCv.fileName}</p>
          <p className="mt-1 text-sm text-text-secondary">
            {savedCv.fileType} · {formatFileSize(savedCv.sizeInBytes)} · Actualizado el{" "}
            {formatUploadDate(savedCv.updatedAt)}
          </p>
          <p className="mt-3 flex items-center gap-2 border-b border-border pb-5 text-sm font-semibold text-ink-soft">
            <Check aria-hidden="true" className="size-4" />
            Cargado correctamente
          </p>
          <div className="mt-5">
            <Button
              type="button"
              variant="outline"
              className="h-10 border-border-strong px-4 text-sm text-ink hover:bg-surface-soft"
              disabled={isBusy}
              onClick={onReplace}
            >
              Reemplazar CV
            </Button>
          </div>
          <div className="mt-6">
          <DangerZone title="Eliminar CV" description="El archivo dejará de estar disponible en tu perfil. Puedes reemplazarlo si solo necesitas actualizarlo.">
            <Button
              type="button"
              variant="destructive"
              disabled={isBusy}
              onClick={onDelete}
            >
              Eliminar CV
            </Button>
          </DangerZone>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          Al confirmar la carga, el archivo se mostrará aquí.
        </p>
      )}
    </SectionCard>
  );
}
