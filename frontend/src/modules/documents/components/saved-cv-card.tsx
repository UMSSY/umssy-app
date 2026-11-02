import { History, LoaderCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "@/modules/profile";
import { CV_RECENT_LIMIT } from "../constants/cv-api.constants";
import type { SavedCvCardProps } from "../types/saved-cv-card-props.types";
import { CvListItem } from "./cv-list-item";

export function SavedCvCard({
  cvs = [],
  totalCvs = 0,
  isLoading = false,
  loadError = null,
  isReloading = false,
  isBusy = false,
  openingCvId = null,
  onView,
  onDelete,
  onOpenHistory,
  onRetry,
}: SavedCvCardProps) {
  const items = cvs ?? [];

  if (isLoading) {
    return (
      <SectionCard title="CVs guardados">
        <div aria-busy="true" className="flex flex-col gap-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <span className="sr-only">Cargando tu CV...</span>
        </div>
      </SectionCard>
    );
  }

  if (loadError && items.length === 0) {
    return (
      <SectionCard title="CVs guardados">
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-sm text-danger">
            {loadError}
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-10 border-border-strong px-4 text-sm text-ink hover:bg-surface-soft"
            disabled={isReloading}
            onClick={onRetry}
          >
            {isReloading ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <RotateCw aria-hidden="true" className="size-4" />
            )}
            {isReloading ? "Reintentando..." : "Reintentar"}
          </Button>
        </div>
      </SectionCard>
    );
  }

  if (items.length === 0) {
    return (
      <SectionCard title="CVs guardados">
        <p className="text-sm text-text-secondary">
          Al confirmar la carga, el archivo se mostrará aquí.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="CVs guardados"
      description="El CV más reciente es el vigente en tu perfil."
    >
      <ul aria-label="CVs recientes">
        {items.map((cv) => (
          <CvListItem
            key={cv.id}
            cv={cv}
            isBusy={isBusy || openingCvId !== null}
            isOpening={openingCvId === cv.id}
            onView={onView}
            onDelete={onDelete}
          />
        ))}
      </ul>
      {totalCvs > CV_RECENT_LIMIT ? (
        <div className="mt-5 border-t border-border pt-5">
          <Button
            type="button"
            variant="outline"
            className="h-10 border-border-strong px-4 text-sm text-ink hover:bg-surface-soft"
            onClick={onOpenHistory}
          >
            <History aria-hidden="true" className="size-4" />
            Ver historial ({totalCvs})
          </Button>
        </div>
      ) : null}
    </SectionCard>
  );
}
