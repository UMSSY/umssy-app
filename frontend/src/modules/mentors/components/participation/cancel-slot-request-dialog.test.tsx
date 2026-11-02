import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { mentorParticipationService } from "../../services/mentor-participation.service";
import { PendingParticipation } from "./pending-participation";

vi.mock("@/modules/mentorship/hooks/use-mentorship-catalogs", () => ({
  useMentorshipCatalogs: () => ({ technicalAreas: [], orientationTypes: [], isTechnicalAreasLoading: false, isOrientationTypesLoading: false }),
}));
const request = { id: "request", userId: "user", status: "PENDING", queuedAt: "2026-10-26T15:00:00Z", createdAt: "2026-10-26T15:00:00Z", technicalAreaIds: [], orientationTypeIds: [], email: "titulado@umssy.test" };
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Cancelación persistida", () => {
  it("Volver conserva la solicitud sin llamar al backend", () => {
    const cancel = vi.spyOn(mentorParticipationService, "cancel");
    renderWithQuery(<PendingParticipation request={request} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar solicitud" }));
    expect(screen.getByText(/perderás tu prioridad en la lista FIFO/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(cancel).not.toHaveBeenCalled();
  });

  it("muestra el éxito tras la respuesta real", async () => {
    const onCancelled = vi.fn();
    vi.spyOn(mentorParticipationService, "cancel").mockResolvedValue({ ...request, status: "CANCELLED" });
    renderWithQuery(<PendingParticipation request={request} onCancelled={onCancelled} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar solicitud" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelación" }));
    await waitFor(() => expect(onCancelled).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("status")).toHaveTextContent("Solicitud cancelada correctamente");
  });

  it("conserva la solicitud si falla la cancelación", async () => {
    const onCancelled = vi.fn();
    vi.spyOn(mentorParticipationService, "cancel").mockRejectedValue(new Error("Network"));
    renderWithQuery(<PendingParticipation request={request} onCancelled={onCancelled} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar solicitud" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelación" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo completar");
    expect(onCancelled).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Solicitud pendiente", hidden: true })).toBeInTheDocument();
  });
});
