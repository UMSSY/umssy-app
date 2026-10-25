export type SlotRequestScenario = "success" | "error" | "duplicate";
export type SlotCancellationScenario = "success" | "error";
export type SlotOffer = { id: string; requestId: string; expiresAt: string; canRequestAgain: boolean };

export function simulateSlotOffer(requestId: string, expired: boolean): SlotOffer {
  if (!isSlotRequestPreviewEnabled()) throw new Error("Simulación no disponible.");
  // Fixed absolute deadline for this scenario, created once, never on modal open.
  return { id: crypto.randomUUID(), requestId, expiresAt: new Date(Date.now() + (expired ? -1000 : 86400000)).toISOString(), canRequestAgain: false };
}

export async function simulateOfferConfirmation(scenario: "success" | "error", offer: SlotOffer) {
  if (!isSlotRequestPreviewEnabled()) throw new Error("Simulación no disponible.");
  await new Promise((resolve) => setTimeout(resolve, 800));
  // Authoritative adapter response in development. A real backend must validate this.
  if (!Number.isFinite(Date.parse(offer.expiresAt)) || Date.now() >= Date.parse(offer.expiresAt)) throw new Error("El plazo ha vencido");
  if (scenario === "error") throw new Error("No se pudo confirmar tu participación. Intenta nuevamente.");
  return { offerId: offer.id, requestId: offer.requestId };
}
export type PendingSlotRequest = {
  id: string;
  registeredAt: string;
  areas: string[];
  orientations: string[];
};

export function isSlotRequestPreviewEnabled() {
  return process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_APP_ENV !== "prod";
}

/** In-memory development response only. No API or PostgreSQL writes. */
export async function simulateSlotRequest(scenario: SlotRequestScenario, areas: string[], orientations: string[]) {
  if (!isSlotRequestPreviewEnabled()) throw new Error("Simulación no disponible.");
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (scenario === "error") throw new Error("No se pudo registrar tu solicitud. Intenta nuevamente.");
  return {
    request: {
      id: crypto.randomUUID(),
      registeredAt: new Date(Date.now() - (scenario === "duplicate" ? 3 * 86400000 : 0)).toISOString(),
      areas: [...areas],
      orientations: [...orientations],
    },
    duplicate: scenario === "duplicate",
  };
}

/** Simulates a cancellation response; never writes to the backend. */
export async function simulateSlotCancellation(scenario: SlotCancellationScenario, requestId: string) {
  if (!isSlotRequestPreviewEnabled()) throw new Error("Simulación no disponible.");
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (scenario === "error") throw new Error("No se pudo cancelar tu solicitud. Intenta nuevamente.");
  return { id: requestId };
}
