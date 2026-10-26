import { cleanup, fireEvent, screen } from "@testing-library/react";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { Button } from "@/components/ui/button";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelParticipation, confirmOffer, getParticipation, requestParticipation,
  type ParticipationState,
} from "@/modules/mentorship/services/mentor-participation.service";
import { useSlotRequestPreview } from "./use-slot-request-preview";

vi.mock("@/modules/mentorship/services/mentor-participation.service", () => ({
  cancelParticipation: vi.fn(), confirmOffer: vi.fn(), getParticipation: vi.fn(), requestParticipation: vi.fn(),
}));

const request: NonNullable<ParticipationState["request"]> = {
  id: "request-1", requestedAt: "2026-10-25T10:00:00.000Z", queuedAt: "2026-10-25T10:00:00.000Z",
  technicalAreas: [{ id: "area-1", name: "Backend" }],
  orientationTypes: [{ id: "orientation-1", name: "Orientación" }], offer: null,
};

function Harness() {
  const flow = useSlotRequestPreview();
  return <div>
    <p data-testid="status">{flow.request ? "PENDING" : flow.offer ? "OFFERED" : flow.active ? "ACTIVE" : "NONE"}</p>
    <Button onClick={() => void flow.submit("success", ["Backend"], ["Orientación"], {
      technicalAreaIds: ["area-1"], orientationTypeIds: ["orientation-1"],
    })}>Solicitar</Button>
    <Button onClick={() => void flow.cancel("success")}>Cancelar</Button>
    <Button onClick={() => void flow.confirmOffer("success")}>Confirmar</Button>
  </div>;
}

describe("HU7 conectado al backend", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_HU7_PREVIEW", "false");
    vi.clearAllMocks();
  });
  afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

  it("registra y cancela la solicitud por los endpoints reales", async () => {
    let state: ParticipationState = { email: "mentor@umssy.test", status: "NONE", request: null };
    vi.mocked(getParticipation).mockImplementation(async () => state);
    vi.mocked(requestParticipation).mockImplementation(async () => {
      state = { ...state, status: "PENDING", request };
      return { id: request.id };
    });
    vi.mocked(cancelParticipation).mockImplementation(async () => {
      state = { ...state, status: "CANCELLED", request: null };
    });

    renderWithQuery(<Harness />);
    await screen.findByText("NONE");
    fireEvent.click(screen.getByRole("button", { name: "Solicitar" }));
    expect(await screen.findByText("PENDING")).toBeInTheDocument();
    expect(requestParticipation).toHaveBeenCalledWith({ technicalAreaIds: ["area-1"], orientationTypeIds: ["orientation-1"] });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByText("NONE")).toBeInTheDocument();
    expect(cancelParticipation).toHaveBeenCalledOnce();
  });

  it("confirma la oferta recibida y muestra la participación activa", async () => {
    let state: ParticipationState = { email: "mentor@umssy.test", status: "OFFERED", request: {
      ...request, offer: { id: "offer-1", status: "OFFERED", offeredAt: "2026-10-25T10:00:00.000Z", expiresAt: "2026-10-26T10:00:00.000Z" },
    } };
    vi.mocked(getParticipation).mockImplementation(async () => state);
    vi.mocked(confirmOffer).mockImplementation(async () => { state = { ...state, status: "ACTIVE" }; });

    renderWithQuery(<Harness />);
    expect(await screen.findByText("OFFERED")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("ACTIVE")).toBeInTheDocument();
    expect(confirmOffer).toHaveBeenCalledWith("offer-1");
  });
});
