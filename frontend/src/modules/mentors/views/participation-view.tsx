"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useParticipation } from "../hooks/use-participation";
import { ParticipationEmptyState } from "../components/participation/participation-empty-state";
import { ParticipationLoading } from "../components/participation/participation-loading";
import { ParticipationOverview } from "../components/participation/participation-overview";

export function ParticipationView() {
  const { state, hasLoadError, retry } = useParticipation();

  if (hasLoadError) {
    return (
      <main className="mx-auto w-full max-w-7xl">
        <Alert variant="destructive" className="mx-auto max-w-5xl">
          <p>No se pudo cargar tu participación como mentor.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              retry();
            }}
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
