import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { automaticValidationService } from "./automatic-validation.service";

const get = vi.spyOn(apiClient, "get");
const patch = vi.spyOn(apiClient, "patch");
const SUMMARY = { manualReviewCount: 5, autoApprovedTodayCount: 12, autoRejectedTodayCount: 1, receivedTodayCount: 17 };

beforeEach(() => {
  get.mockReset();
  patch.mockReset();
});

describe("automaticValidationService.getAutomationSummary", () => {
  it("devuelve los contadores de la validación automática", async () => {
    get.mockResolvedValue({ status: 200, data: { data: SUMMARY } } as never);
    expect(await automaticValidationService.getAutomationSummary()).toEqual({ ok: true, data: SUMMARY });
    expect(get).toHaveBeenCalledWith("/access-requests/automation-summary", expect.anything());
  });

  it("rechaza una respuesta incompleta, un error y un fallo de conexión", async () => {
    get.mockResolvedValue({ status: 200, data: { data: { manualReviewCount: 5 } } } as never);
    expect(await automaticValidationService.getAutomationSummary()).toMatchObject({ ok: false, status: 0 });
    get.mockResolvedValue({ status: 403, data: {} } as never);
    expect(await automaticValidationService.getAutomationSummary()).toMatchObject({ ok: false, status: 403 });
    get.mockRejectedValueOnce(new Error("Network Error"));
    expect(await automaticValidationService.getAutomationSummary()).toMatchObject({ ok: false, status: 0 });
  });
});

describe("automaticValidationService.getRequestHistory", () => {
  it("devuelve los eventos de la solicitud", async () => {
    const items = [{ id: "evt-1", action: "submitted", occurredAt: "2026-10-24T13:20:00.000Z", actorName: "María", actorRole: "titulado", detail: null }];
    get.mockResolvedValue({ status: 200, data: { data: items } } as never);
    expect(await automaticValidationService.getRequestHistory("req-1")).toEqual({ ok: true, data: items });
    expect(get).toHaveBeenCalledWith("/access-requests/req-1/history", expect.anything());
  });

  it("maneja respuestas inválidas y fallos", async () => {
    get.mockResolvedValue({ status: 200, data: { data: "x" } } as never);
    expect(await automaticValidationService.getRequestHistory("req-1")).toMatchObject({ ok: false, status: 0 });
    get.mockResolvedValue({ status: 401, data: {} } as never);
    expect(await automaticValidationService.getRequestHistory("req-1")).toMatchObject({ ok: false, status: 401 });
    get.mockRejectedValueOnce(new Error("Network Error"));
    expect(await automaticValidationService.getRequestHistory("req-1")).toMatchObject({ ok: false, status: 0 });
  });
});

describe("automaticValidationService.revertApproval", () => {
  it("CA7: revierte la aprobación automática", async () => {
    patch.mockResolvedValue({ status: 200, data: { data: { id: "req-1", status: "in_review" } } } as never);
    expect(await automaticValidationService.revertApproval("req-1")).toEqual({ ok: true, data: { id: "req-1", status: "in_review" } });
    expect(patch).toHaveBeenCalledWith("/access-requests/req-1/revert-approval", undefined, expect.anything());
  });

  it("muestra el motivo cuando no se puede revertir y maneja los demás errores", async () => {
    patch.mockResolvedValue({ status: 409, data: { detail: "La persona titulada ya activó su cuenta; la aprobación no se puede revertir" } } as never);
    expect(await automaticValidationService.revertApproval("req-1")).toEqual({
      ok: false,
      status: 409,
      message: "La persona titulada ya activó su cuenta; la aprobación no se puede revertir",
    });
    patch.mockResolvedValue({ status: 404, data: {} } as never);
    expect(await automaticValidationService.revertApproval("req-1")).toMatchObject({ ok: false, status: 404 });
    patch.mockResolvedValue({ status: 200, data: { data: { status: "approved" } } } as never);
    expect(await automaticValidationService.revertApproval("req-1")).toMatchObject({ ok: false, status: 0 });
    patch.mockRejectedValueOnce(new Error("Network Error"));
    expect(await automaticValidationService.revertApproval("req-1")).toMatchObject({ ok: false, status: 0 });
  });
});
