import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { radarIntegrationApi, type IntegrationRadar, type ReviewRow } from "../sprint2-integration/radar-integration-api";
import { ReviewQueueView } from "./review-queue-view";

vi.mock("../sprint2-integration/radar-integration-api", () => ({ radarIntegrationApi: { reviews: vi.fn(), decision: vi.fn(), adminReprocessCv: vi.fn() } }));
const row: ReviewRow = { id: "skill:skill-1", userId: "owner", userName: "Persona QA", type: "skill", title: "Python", status: "pending", date: "2026-10-26T12:00:00Z", areaId: "data-ai", evidenceRefs: [] };
beforeEach(() => {
  vi.mocked(radarIntegrationApi.reviews).mockResolvedValue([row]);
  vi.mocked(radarIntegrationApi.decision).mockResolvedValue({} as IntegrationRadar);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.resetAllMocks(); });

describe("ReviewQueueView with the persistent API", () => {
  it("reviews a real queued skill and reloads the saved decision", async () => {
    const user = userEvent.setup();
    render(<ReviewQueueView />);
    await screen.findByRole("heading", { name: row.userName });
    vi.mocked(radarIntegrationApi.reviews).mockResolvedValue([{ ...row, status: "approved" }]);
    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    await waitFor(() => expect(radarIntegrationApi.decision).toHaveBeenCalledWith("skill", "skill-1", "approved"));
    await user.click(screen.getByRole("button", { name: "Aprobados" }));
    expect(await screen.findByRole("heading", { name: row.userName })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revocar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Aprobar" })).toBeDisabled();
  });

  it("does not save a cancelled administrative decision", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const user = userEvent.setup();
    render(<ReviewQueueView />);
    await screen.findByRole("heading", { name: row.userName });
    await user.click(screen.getByRole("button", { name: "Rechazar" }));
    expect(radarIntegrationApi.decision).not.toHaveBeenCalled();
  });

  it("shows an empty queue without demonstration profiles", async () => {
    vi.mocked(radarIntegrationApi.reviews).mockResolvedValue([]);
    render(<ReviewQueueView />);
    expect(await screen.findByText("No hay elementos en esta categoría.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Carlos|María|Ana/ })).not.toBeInTheDocument();
  });

  it("allows retry after the API rejects the queue request", async () => {
    vi.mocked(radarIntegrationApi.reviews).mockRejectedValueOnce(new Error("unavailable")).mockResolvedValue([row]);
    const user = userEvent.setup();
    render(<ReviewQueueView />);
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { name: row.userName })).toBeInTheDocument();
  });
});