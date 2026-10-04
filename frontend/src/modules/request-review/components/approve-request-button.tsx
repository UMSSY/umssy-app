"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { REQUEST_STATUS_LABELS } from "../constants/request-status.constants";
import { useApproveRequest } from "../hooks/use-approve-request";
import type {
  ApproveRequestButtonProps,
  RequestStatus,
} from "../types/request-review-types";

export function ApproveRequestButton({
  requestId,
  status,
  applicantEmail,
  onApproved,
}: ApproveRequestButtonProps) {
  const { approve, clearError, isLoading, error } = useApproveRequest();
  const [isOpen, setIsOpen] = useState(false);
  const [approvedStatus, setApprovedStatus] = useState<RequestStatus | null>(null);

  const currentStatus = approvedStatus ?? status;
  const isApproved = currentStatus === "APPROVED";
  const canApprove = currentStatus === "IN_REVIEW";

  function handleOpenChange(nextOpen: boolean) {
    // Mientras se procesa la aprobacion no se permite cerrar el dialogo
    if (isLoading) {
      return;
    }
    if (!nextOpen) {
      clearError();
    }
    setIsOpen(nextOpen);
  }

  async function handleConfirm() {
    const result = await approve(requestId);
    if (result) {
      setApprovedStatus(result.status);
      setIsOpen(false);
      onApproved?.(result);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-secondary">
        Estado:{" "}
        <span className="font-semibold text-ink">
          {REQUEST_STATUS_LABELS[currentStatus]}
        </span>
      </p>

      {isApproved ? (
        <p role="status" className="text-sm font-semibold text-ink">
          Solicitud aprobada. Se envió el código de activación a {applicantEmail}.
        </p>
      ) : (
        <Button
          type="button"
          variant="brand"
          disabled={!canApprove}
          onClick={() => setIsOpen(true)}
        >
          Aprobar solicitud
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar solicitud</DialogTitle>
            <DialogDescription>
              Al aprobar, se enviará el código de activación al correo{" "}
              <span className="font-semibold text-ink">{applicantEmail}</span> del
              titulado. ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p role="alert" className="text-sm font-bold text-danger">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="brand"
              disabled={isLoading}
              onClick={handleConfirm}
            >
              {isLoading ? "Aprobando..." : "Confirmar aprobación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
