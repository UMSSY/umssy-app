"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/shared/contexts/auth-context";
import { mentorParticipationService } from "../../services/mentor-participation.service";
import { participationErrorCode, participationErrorMessage } from "../../utils/participation-error";

export function MentorExitDialog() {
  const [open, setOpen] = useState(false);
  const inFlight = useRef(false);
  const client = useQueryClient();
  const { refreshRoles } = useAuth();
  const leave = useMutation({
    mutationFn: () => mentorParticipationService.leave(),
    onSuccess: async () => {
      await Promise.allSettled([
        refreshRoles(),
        client.invalidateQueries({ queryKey: ["mentors", "participation"] }),
        client.invalidateQueries({ queryKey: ["mentor-participation-requests"] }),
      ]);
      setOpen(false);
    },
  });
  async function confirmExit() {
    if (inFlight.current) return;
    inFlight.current = true;
    try { await leave.mutateAsync(); }
    catch { /* The mutation renders the error and preserves the current role. */ }
    finally { inFlight.current = false; }
  }
  return <>
    <Button variant="outline" onClick={() => { leave.reset(); setOpen(true); }}>Pausar mentoría</Button>
    <Dialog open={open} onOpenChange={(value) => { if (!leave.isPending) setOpen(value); }}>
      <DialogContent showCloseButton={!leave.isPending}>
        <DialogTitle>¿Finalizar tu participación como mentor?</DialogTitle>
        <DialogDescription>Perderás el rol de mentor y liberarás tu cupo. Si vuelves a postular, deberás cumplir los requisitos y seguir el orden normal de la lista de espera.</DialogDescription>
        {leave.isError && <div role="alert">
          <p>{participationErrorMessage(leave.error)}</p>
          {participationErrorCode(leave.error) === "MENTOR_HAS_FUTURE_APPOINTMENTS" && <Link href="/mentor/availability" className="underline">Resolver mis citas en la agenda</Link>}
        </div>}
        <footer className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" disabled={leave.isPending} onClick={() => setOpen(false)}>Volver</Button>
          <Button disabled={leave.isPending} onClick={() => void confirmExit()}>{leave.isPending ? "Finalizando..." : "Confirmar salida"}</Button>
        </footer>
      </DialogContent>
    </Dialog>
  </>;
}
