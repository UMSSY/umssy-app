import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { DEFAULT_AUDIT_FILTERS } from "../constants/audit-log.constants";
import { auditLogRecordsService } from "./audit-log-records.service";

const get = vi.spyOn(apiClient, "get");
const reply = (status: number, data: unknown, headers: Record<string, string> = {}) => get.mockResolvedValue({ status, data, headers } as never);

beforeEach(() => get.mockReset());

describe("auditLogRecordsService.listResponsibles", () => {
  it("devuelve el catálogo del servidor", async () => {
    reply(200, { data: [{ id: "admin-1", name: "Carla Montaño" }] });
    expect(await auditLogRecordsService.listResponsibles()).toEqual({ ok: true, data: [{ id: "admin-1", name: "Carla Montaño" }] });
    expect(get).toHaveBeenCalledWith("/audit-events/responsibles", expect.anything());
  });

  it("maneja respuestas inválidas, errores y fallos de conexión", async () => {
    reply(200, { data: "x" });
    expect(await auditLogRecordsService.listResponsibles()).toMatchObject({ ok: false, status: 0 });
    reply(403, {});
    expect(await auditLogRecordsService.listResponsibles()).toMatchObject({ ok: false, status: 403 });
    get.mockRejectedValueOnce(new Error("Network Error"));
    expect(await auditLogRecordsService.listResponsibles()).toMatchObject({ ok: false, status: 0 });
  });
});

describe("auditLogRecordsService.exportCsv", () => {
  it("envía exactamente los filtros del listado y usa el nombre que informa el servidor", async () => {
    const blob = new Blob(["Fecha y hora"], { type: "text/csv" });
    reply(200, blob, { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="registro-auditoria-2026-10-22.csv"' });

    const result = await auditLogRecordsService.exportCsv({ ...DEFAULT_AUDIT_FILTERS, action: "rejected", from: "2026-09-01" });

    expect(get).toHaveBeenCalledWith("/audit-events/export", expect.objectContaining({ params: { action: "rejected", from: "2026-09-01" }, responseType: "blob" }));
    expect(result).toEqual({ ok: true, data: { blob, fileName: "registro-auditoria-2026-10-22.csv" } });
  });

  it("sin cabecera de nombre usa el nombre de respaldo", async () => {
    reply(200, new Blob(["x"]), { "content-type": "text/csv" });
    expect(await auditLogRecordsService.exportCsv(DEFAULT_AUDIT_FILTERS)).toMatchObject({ ok: true, data: { fileName: "registro-auditoria.csv" } });
  });

  it("un error no se entrega como CSV: lee el mensaje del cuerpo", async () => {
    reply(400, new Blob([JSON.stringify({ detail: "Filtros inválidos", errors: [{ field: "to", message: "La fecha final no existe" }] })]));
    expect(await auditLogRecordsService.exportCsv(DEFAULT_AUDIT_FILTERS)).toEqual({ ok: false, status: 400, message: "La fecha final no existe" });
    reply(500, new Blob(["<html>"]));
    expect(await auditLogRecordsService.exportCsv(DEFAULT_AUDIT_FILTERS)).toMatchObject({ ok: false, status: 500 });
  });

  it("rechaza una respuesta 200 que no es CSV y los fallos de conexión", async () => {
    reply(200, new Blob(["{}"]), { "content-type": "application/json" });
    expect(await auditLogRecordsService.exportCsv(DEFAULT_AUDIT_FILTERS)).toMatchObject({ ok: false, status: 0 });
    get.mockRejectedValueOnce(new Error("Network Error"));
    expect(await auditLogRecordsService.exportCsv(DEFAULT_AUDIT_FILTERS)).toMatchObject({ ok: false, status: 0 });
  });
});
