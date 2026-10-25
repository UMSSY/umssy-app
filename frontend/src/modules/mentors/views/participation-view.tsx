"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MentorParticipationPanel } from "@/modules/mentorship/components/participation/mentor-participation-panel";
import { getCapacity, getParticipation } from "@/modules/mentorship/services/mentor-participation.service";
import { useParticipation } from "../hooks/use-participation";
import { ParticipationEmptyState } from "../components/participation/participation-empty-state";
import { ParticipationLoading } from "../components/participation/participation-loading";
import { ParticipationOverview } from "../components/participation/participation-overview";

export function ParticipationView() {
  const queryClient = useQueryClient();
  const participation = useQuery({ queryKey: ["mentor-participation", "me"], queryFn: ({ signal }) => getParticipation(signal), refetchInterval: 15_000 });
  const capacity = useQuery({ queryKey: ["mentor-participation", "capacity"], queryFn: ({ signal }) => getCapacity(signal), refetchInterval: 15_000 });
  const refresh = useCallback(async () => { await queryClient.invalidateQueries({ queryKey: ["mentor-participation"] }); }, [queryClient]);
  const { state, hasLoadError, retry } = useParticipation();

  if (participation.isError || (participation.data?.status === "ACTIVE" && hasLoadError)) {
    return (
      <main className="min-h-full bg-surface-soft px-4 py-6 sm:py-8">
        <Alert variant="destructive" className="mx-auto max-w-5xl">
          <p>No se pudo cargar tu participación como mentor.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              retry(); void participation.refetch();
            }}
          >
            Reintentar
          </Button>
        </Alert>
      </main>
    );
  }

  if (participation.isPending || (participation.data?.status === "ACTIVE" && state === undefined)) {
    return <ParticipationLoading />;
  }

  if (participation.data?.status !== "ACTIVE") {
    return <MentorParticipationPanel key={`${participation.data!.status}:${participation.data!.request?.id ?? "none"}`} state={participation.data!} capacity={capacity.data} refresh={refresh} />;
  }

  return (
    <div className="space-y-6">
      {state ? <ParticipationOverview areas={state.areas} orientations={state.orientations} /> : <ParticipationEmptyState />}
      <MentorParticipationPanel key={`${participation.data.status}:${participation.data.request?.id ?? "none"}`} state={participation.data} capacity={capacity.data} refresh={refresh} />
    </div>
  );
}
