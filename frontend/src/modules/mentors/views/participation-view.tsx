"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MentorParticipationPanel } from "@/modules/mentorship/components/participation/mentor-participation-panel";
import { getCapacity, type ParticipationState } from "@/modules/mentorship/services/mentor-participation.service";
import { useParticipation } from "../hooks/use-participation";
import { ParticipationEmptyState } from "../components/participation/participation-empty-state";
import { ParticipationLoading } from "../components/participation/participation-loading";
import { ParticipationOverview } from "../components/participation/participation-overview";
import { SlotAvailabilityPreview } from "../components/participation/slot-availability-preview";
import { PendingParticipation } from "../components/participation/pending-participation";
import { useSlotRequestPreview } from "../hooks/use-slot-request-preview";
import { SlotCancellationFeedback } from "../components/participation/slot-cancellation-feedback";
import { SlotOfferParticipation } from "../components/participation/slot-offer-participation";

export function ParticipationView() {
  const preview = useSlotRequestPreview();
  if (preview.enabled) {
    if (preview.offer || preview.active) return <SlotOfferParticipation />;
    if (preview.request) return <PendingParticipation />;
    if (preview.notice === "cancelled") return <SlotCancellationFeedback />;
    return <><SlotAvailabilityPreview /><ParticipationContent /></>;
  }
  if (preview.isLoading) return <ParticipationLoading />;
  if (preview.loadError) return <main className="mx-auto w-full max-w-7xl"><Alert variant="destructive" className="mx-auto max-w-5xl"><p>No se pudo consultar tu solicitud de mentoría.</p><Button type="button" variant="outline" onClick={() => { void preview.reload(); }}>Reintentar</Button></Alert></main>;
  if (preview.request) return <PendingParticipation />;
  if (preview.offer) return <SlotOfferParticipation />;
  if (preview.notice === "cancelled") return <SlotCancellationFeedback />;
  if (preview.realState) return <RealParticipationContent state={preview.realState} />;
  return <ParticipationLoading />;
}

function RealParticipationContent({ state }: { state: ParticipationState }) {
  const queryClient = useQueryClient();
  const capacity = useQuery({ queryKey: ["mentor-participation", "capacity"], queryFn: ({ signal }) => getCapacity(signal), refetchInterval: 15_000 });
  const refresh = useCallback(async () => { await queryClient.invalidateQueries({ queryKey: ["mentor-participation"] }); }, [queryClient]);
  return <>
    {state.status === "ACTIVE" && <ParticipationContent />}
    <MentorParticipationPanel key={`${state.status}:${state.request?.id ?? "none"}`} state={state} capacity={capacity.data} refresh={refresh} />
  </>;
}

function ParticipationContent() {
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
