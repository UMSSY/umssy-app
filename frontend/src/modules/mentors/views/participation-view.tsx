
"use client";

import { useSyncExternalStore } from "react";
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

const getServerToken = () => null;

export function ParticipationView() {
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
    return (
      <PendingParticipation
        request={requestQuery.data}
      />
    );
  }

  return <ParticipationContent />;
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
    return <ParticipationEmptyState />;
  }

  return (
    <ParticipationOverview
      areas={state.areas}
      orientations={state.orientations}
    />
  );
}
