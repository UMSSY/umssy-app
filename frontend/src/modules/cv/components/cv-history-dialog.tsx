"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedbackMessage } from "@/modules/profile";
import { CV_ERROR_MESSAGES } from "../constants/cv-error-messages.constants";
import { useCvFeedback } from "../hooks/use-cv-feedback";
import { useCvHistory } from "../hooks/use-cv-history";
import { useCvViewer } from "../hooks/use-cv-viewer";
import type { CvHistoryDialogProps } from "../types/cv-history-dialog-props.types";
import type { SavedCv } from "../types/saved-cv.types";
import { getCvErrorMessage } from "../utils/get-cv-error-message";
import { CvListItem } from "./cv-list-item";
import { CvViewerDialog } from "./cv-viewer-dialog";
import { DeleteCvDialog } from "./delete-cv-dialog";

function CvHistoryDialogBody({
  isDeleting = false,
  onDelete,
  onClose,
}: Omit<CvHistoryDialogProps, "isOpen">) {
  const [page, setPage] = useState(1);
  const [cvToDelete, setCvToDelete] = useState<SavedCv | null>(null);
  const { feedback, setFeedback } = useCvFeedback();
  const { cvs, totalCvs, totalPages, isLoading, loadError } = useCvHistory(page);
  const { preview, openingCvId, openCv, closeCv } = useCvViewer();

  if (totalPages > 0 && page > totalPages) {
    setPage(totalPages);
  }

  const handleView = async (cv: SavedCv) => {
    setFeedback(null);
    const openError = await openCv(cv);

    if (openError) {
      setFeedback({ type: "error", message: openError });
    }
  };

  const openDeleteDialog = (cv: SavedCv) => {
    setFeedback(null);
    setCvToDelete(cv);
  };

  const handleConfirmDelete = async (cv: SavedCv) => {
    try {
      await onDelete(cv);
      setFeedback({ type: "success", message: "El CV se eliminó." });
    } catch (error) {
      setFeedback({ type: "error", message: getCvErrorMessage(error, CV_ERROR_MESSAGES.delete) });
    }
    setCvToDelete(null);
  };

  return (
    <Dialog open onOpenChange={(isOpen) => (isOpen || isDeleting ? undefined : onClose())}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl gap-5 rounded-lg border border-border bg-surface p-6 text-ink ring-0 sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-tight text-xl font-bold text-ink">Historial de CVs</DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            Todos los CVs que subiste, del más reciente al más antiguo.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div aria-busy="true" className="flex flex-col gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <span className="sr-only">Cargando el historial...</span>
          </div>
        ) : null}
        {feedback ? <FeedbackMessage feedback={feedback} /> : null}
        {loadError ? (
          <p role="alert" className="text-sm text-danger">
            {loadError}
          </p>
        ) : null}
        {!isLoading && !loadError && cvs.length === 0 ? (
          <p className="text-sm text-text-secondary">Aún no tienes CVs guardados.</p>
        ) : null}
        {!isLoading && cvs.length > 0 ? (
          <ul aria-label="Historial de CVs" className="max-h-[50vh] overflow-y-auto pr-1">
            {cvs.map((cv) => (
              <CvListItem
                key={cv.id}
                cv={cv}
                isBusy={isDeleting || openingCvId !== null}
                isOpening={openingCvId === cv.id}
                onView={handleView}
                onDelete={openDeleteDialog}
              />
            ))}
          </ul>
        ) : null}
        <DialogFooter className="mx-0 mb-0 flex-row items-center justify-between rounded-b-2xl border-t-0 bg-transparent p-0">
          {totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 border-border-strong px-3 text-sm text-ink hover:bg-surface-soft"
                disabled={page <= 1 || isDeleting}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Anterior
              </Button>
              <span className="text-sm text-text-secondary">
                Página {page} de {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                className="h-9 border-border-strong px-3 text-sm text-ink hover:bg-surface-soft"
                disabled={page >= totalPages || isDeleting}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          ) : (
            <span />
          )}
          <Button
            type="button"
            className="h-10 bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-brand-hover"
            disabled={isDeleting}
            onClick={onClose}
          >
            Cerrar
          </Button>
        </DialogFooter>
        <DeleteCvDialog
          cv={cvToDelete}
          hasOtherCvs={totalCvs > 1}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setCvToDelete(null)}
        />
        <CvViewerDialog preview={preview} onClose={closeCv} />
      </DialogContent>
    </Dialog>
  );
}

export function CvHistoryDialog({ isOpen, ...props }: CvHistoryDialogProps) {
  if (!isOpen) {
    return null;
  }

  return <CvHistoryDialogBody {...props} />;
}
