import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { DEFAULT_AUDIT_FILTERS } from "../constants/audit-log.constants";
import { auditLogService, toFilterParams } from "./audit-log.service";

const get = vi.spyOn(apiClient, "get");
const reply = (status: number, data: unknown) => get.mockResolvedValue({ status, data } as never);

describe("toFilterParams", () => {
  it("solo envía los filtros con valor", () => {
    expect(toFilterParams({ ...DEFAULT_AUDIT_FILTERS, action: "approved", from: "2026-09-01" })).toEqual({ action: "approved", from: "2026-09-01" });
  });
});

describe("auditLogService.listEvents", () => {
  beforeEach(() => get.mockReset());

  it("pide la página y el tamaño con los filtros y devuelve eventos, total, página y límite", async () => {
    reply(200, { data: { items: [{ id: "evt-1" }], total: 11, page: 2, limit: 10 }, page: 2, offset: 10 });

    const result = await auditLogService.listEvents(2, { ...DEFAULT_AUDIT_FILTERS, search: "SOL" });

    expect(get).toHaveBeenCalledWith("/audit-events", expect.objectContaining({ params: { page: 2, limit: 10, search: "SOL" } }));
    expect(result).toEqual({ ok: true, data: { items: [{ id: "evt-1" }], total: 11, page: 2, limit: 10 } });
  });

  it("una lista vacía es un éxito, no un error", async () => {
    reply(200, { data: { items: [], total: 0 } });
    expect(await auditLogService.listEvents(1, DEFAULT_AUDIT_FILTERS)).toEqual({ ok: true, data: { items: [], total: 0, page: 1, limit: 10 } });
  });

  it.each([
    [401, { detail: "x" }, "Tu sesión expiró. Inicia sesión de nuevo."],
    [403, { detail: "x" }, "No tienes permiso para ver el registro de auditoría."],
    [400, { detail: "to: error", errors: [{ field: "to", message: "La fecha final no puede ser anterior a la fecha inicial" }] }, "La fecha final no puede ser anterior a la fecha inicial"],
    [500, "<html>", "No se pudo completar la operación. Inténtalo de nuevo."],
  ])("traduce el %d a un mensaje en español", async (status, body, message) => {
    reply(status, body);
    expect(await auditLogService.listEvents(1, DEFAULT_AUDIT_FILTERS)).toEqual({ ok: false, status, message });
  });

  it("distingue una respuesta mal formada y un fallo de conexión", async () => {
    reply(200, { data: { total: 3 } });
    expect(await auditLogService.listEvents(1, DEFAULT_AUDIT_FILTERS)).toMatchObject({ ok: false, status: 0 });
    get.mockRejectedValueOnce(new Error("Network Error"));
    expect(await auditLogService.listEvents(1, DEFAULT_AUDIT_FILTERS)).toEqual({
      ok: false,
      status: 0,
      message: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
    });
  });
});

describe("auditLogService.getEvidenceBlob", () => {
  beforeEach(() => get.mockReset());

  it("pide el documento por el identificador del evento", async () => {
    const blob = new Blob(["%PDF"], { type: "application/pdf" });
    reply(200, blob);

    expect(await auditLogService.getEvidenceBlob("evt-1")).toEqual({ ok: true, data: blob });
    expect(get).toHaveBeenCalledWith("/audit-events/evt-1/document", expect.objectContaining({ responseType: "blob" }));
  });

  it.each([
    [404, "Este evento no tiene un documento asociado."],
    [410, "El documento de este evento ya no está disponible."],
    [403, "No tienes permiso para ver el registro de auditoría."],
  ])("con %d devuelve un mensaje y ningún archivo", async (status, message) => {
    reply(status, new Blob(["{}"]));
    expect(await auditLogService.getEvidenceBlob("evt-1")).toEqual({ ok: false, status, message });
  });

  it("rechaza una respuesta que no es un archivo y los fallos de conexión", async () => {
    reply(200, "texto");
    expect(await auditLogService.getEvidenceBlob("evt-1")).toMatchObject({ ok: false, status: 0 });
    get.mockRejectedValueOnce(new Error("Network Error"));
    expect(await auditLogService.getEvidenceBlob("evt-1")).toMatchObject({ ok: false, status: 0 });
  });
});

describe("auditLogService.getEventDetail", () => {
  beforeEach(() => get.mockReset());

  const validDetail = {
    id: "evt-1",
    code: "EVT-2026-000001",
    occurredAt: "2026-11-20T10:00:00.000Z",
    action: "approved",
    request: { id: "req-1", code: "SOL-2026-0001" },
    applicant: {
      fullName: "Juan Perez",
      career: "Ingeniería de Sistemas",
      graduationYear: 2024,
    },
    responsible: {
      id: "user-1",
      name: "Admin",
      role: "admin",
    },
    rejectionReason: null,
    documentType: "Diploma",
    evidence: null,
  };

  it("devuelve el detalle del evento cuando la carga es válida", async () => {
    reply(200, { data: validDetail });

    const result = await auditLogService.getEventDetail("evt-1");

    expect(get).toHaveBeenCalledWith("/audit-events/evt-1", expect.objectContaining({ validateStatus: expect.any(Function) }));
    expect(result).toEqual({ ok: true, data: validDetail });
  });

  it("distingue una respuesta mal formada y un fallo de conexión", async () => {
    reply(200, { data: { id: "evt-1", incomplete: true } });
    expect(await auditLogService.getEventDetail("evt-1")).toMatchObject({ ok: false, status: 0 });

    get.mockRejectedValueOnce(new Error("Network Error"));
    expect(await auditLogService.getEventDetail("evt-1")).toEqual({
      ok: false,
      status: 0,
      message: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
    });
  });
});
