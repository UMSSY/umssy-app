
"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  getAccessToken,
  subscribeAccessToken,
} from "@/shared/services/storage/access-token-storage";
import { mentorParticipationService } from "../services/mentor-participation.service";
import { ParticipationEmptyState } from "../components/participation/participation-empty-state";
import { ParticipationLoading } from "../components/participation/participation-loading";
import { ParticipationOverview } from "../components/participation/participation-overview";
import { PendingParticipation } from "../components/participation/pending-participation";
import { useParticipation } from "../hooks/use-participation";
import { SlotOfferParticipation } from "../components/participation/slot-offer-participation";
import { MentorExitDialog } from "../components/participation/mentor-exit-dialog";
import { SlotAvailability } from "../components/participation/slot-availability";

const getServerToken = () => null;

export function ParticipationView({ registered = false }: { registered?: boolean }) {
  const [notice, setNotice] = useState<string | null>(null);
  const token = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    getServerToken,
  );

  const requestQuery = useQuery({
    queryKey: ["mentor-participation-requests", token],
    queryFn: () => mentorParticipationService.getCurrent(),
    enabled: Boolean(token),
    retry: false,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  if (!token || requestQuery.isPending) {
    return <ParticipationLoading />;
  }

  if (requestQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-7xl">
        <Alert
          variant="destructive"
          className="mx-auto max-w-5xl"
        >
          <p>No se pudo consultar tu solicitud de participación.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void requestQuery.refetch()}
          >
            Reintentar
          </Button>
        </Alert>
      </main>
    );
  }

  if (
    requestQuery.data?.status?.toUpperCase() === "PENDING"
  ) {
    return <>
      {(notice || registered) && <p role="status">{notice ?? "Solicitud registrada correctamente"}</p>}
      <PendingParticipation
        request={requestQuery.data}
        onCancelled={() => setNotice("Solicitud cancelada correctamente")}
      />
    </>;
  }

  if (requestQuery.data?.status === "OFFERED") {
    if (!requestQuery.data.offer) return <Alert variant="destructive">No se pudo consultar la oferta. Actualiza la página.</Alert>;
    return <SlotOfferParticipation key={requestQuery.data.offer.id} request={requestQuery.data} onConfirmed={() => setNotice("Participación confirmada correctamente")} />;
  }

  const status = requestQuery.data?.status;
  if (status === "EXPIRED" || status === "CANCELLED" || status === "ENDED") {
    return <main className="mx-auto max-w-7xl space-y-6">
      <h1 className="text-2xl font-semibold">Mi participación como mentor</h1>
      <p role="status">{status === "EXPIRED" ? "El plazo ha vencido" : status === "CANCELLED" ? "Solicitud cancelada correctamente" : "Tu participación como mentor ha finalizado"}</p>
      <Link href="/mentorship" className="font-semibold text-accent underline">Volver a solicitar cupo</Link>
    </main>;
  }

  return <>
    {notice && <p role="status">{notice}</p>}
    <ParticipationContent />
  </>;
}

function ParticipationContent() {
  const { state, hasLoadError, retry } = useParticipation();

  if (hasLoadError) {
    return (
      <main className="mx-auto w-full max-w-7xl">
        <Alert
          variant="destructive"
          className="mx-auto max-w-5xl"
        >
          <p>No se pudo cargar tu participación como mentor.</p>
          <Button
            type="button"
            variant="outline"
            onClick={retry}
          >
            Reintentar
          </Button>
        </Alert>
      </main>
    );
  }

  if (state === undefined) {
    return <ParticipationLoading />;
  }

  if (!state) {
    return <div className="space-y-6"><SlotAvailability /><ParticipationEmptyState /></div>;
  }

  return <div className="space-y-6">
    <ParticipationOverview
      areas={state.areas}
      orientations={state.orientations}
    />
    <MentorExitDialog />
  </div>;
}
