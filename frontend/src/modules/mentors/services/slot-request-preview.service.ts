export type SlotRequestScenario = "success" | "error" | "duplicate";
export type SlotCancellationScenario = "success" | "error";
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
