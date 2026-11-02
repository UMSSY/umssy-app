import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { automaticValidationService } from "../services/automatic-validation.service";
import { requestReviewService } from "../services/request-review.service";
import type { ReviewListItem } from "../types/request-review.types";
import { RequestInboxView } from "./request-inbox-view";

const listRequests = vi.spyOn(requestReviewService, "listRequests");
const getSummary = vi.spyOn(requestReviewService, "getSummary");
const getAutomationSummary = vi.spyOn(automaticValidationService, "getAutomationSummary");

const item: ReviewListItem = {
  id: "id-1",
  requestCode: "SOL-1",
  fullName: "Jorge Vargas Lima",
  email: "jorge@umss.test",
  sisCode: "201703315",
  career: "Licenciatura en Ingeniería de Sistemas",
  documentType: "academic_diploma",
  submittedAt: new Date().toISOString(),
  status: "pending",
  validation: { result: "manual_review", matchScore: 61, reason: "El apellido no coincide" },
};

describe("RequestInboxView: validación automática", () => {
  beforeEach(() => {
    listRequests.mockReset();
    listRequests.mockResolvedValue({ ok: true, data: { items: [item], total: 1, page: 1, offset: 0 } });
    getSummary.mockResolvedValue({
      ok: true,
      data: { pendingCount: 5, pendingOver24hCount: 2, decidedTodayCount: 13, approvedTodayCount: 12, rejectedTodayCount: 1, averageReviewHours: 6, reviewTimeGoalHours: 48, rejectedThisMonthCount: 1, topRejectionReason: null },
    });
    getAutomationSummary.mockResolvedValue({ ok: true, data: { manualReviewCount: 5, autoApprovedTodayCount: 12, autoRejectedTodayCount: 1, receivedTodayCount: 17 } });
  });
  afterEach(() => cleanup());

  it("CA3 y CA10: muestra las tarjetas de la validación automática y el motivo de la revisión manual", async () => {
    renderWithQuery(<RequestInboxView />);
    expect(await screen.findByText("Aprobadas automáticamente hoy")).toBeInTheDocument();
    expect(screen.getByText("de 17 solicitudes recibidas")).toBeInTheDocument();
    expect(await screen.findByText("El apellido no coincide")).toBeInTheDocument();
    expect(screen.getByText("61%")).toBeInTheDocument();
  });

  it("CA12: el filtro Validación automática envía el tipo de dictamen y vuelve a la primera página", async () => {
    const user = userEvent.setup();
    renderWithQuery(<RequestInboxView />);
    await screen.findByText("Jorge Vargas Lima");

    await user.click(screen.getByRole("combobox", { name: "Validación automática" }));
    await user.click(await screen.findByRole("option", { name: "Aprobadas automáticamente" }));

    await waitFor(() => expect(listRequests.mock.calls.at(-1)?.[3]).toMatchObject({ validation: "auto_approved" }));
    expect(listRequests.mock.calls.at(-1)?.[1]).toBe(1);
  });
});
