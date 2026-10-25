"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  const showAvailabilityPreview = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_APP_ENV !== "prod";
  if (preview.offer || preview.active) return <SlotOfferParticipation />;
  if (preview.request) return <PendingParticipation />;
  if (preview.notice === "cancelled") return <SlotCancellationFeedback />;

  return (
    <>
      {showAvailabilityPreview && <SlotAvailabilityPreview />}
      <ParticipationContent />
    </>
  );
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
