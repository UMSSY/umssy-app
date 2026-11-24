import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper";
import { DEFAULT_AUDIT_FILTERS } from "../constants/audit-log.constants";
import { auditLogService } from "../services/audit-log.service";
import type { AuditEvent } from "../types/audit-event.types";
import { useAuditEvents } from "./use-audit-events";
import { useEvidenceViewer } from "./use-evidence-viewer";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const listEvents = vi.spyOn(auditLogService, "listEvents");
const getEvidenceBlob = vi.spyOn(auditLogService, "getEvidenceBlob");

const EVENT: AuditEvent = {
  id: "evt-1",
  code: "EVT-2026-000001",
  occurredAt: "2026-09-22T15:41:00.000Z",
  request: { id: "req-1", code: "SOL-2026-0141" },
  applicantName: "Andrea Camacho",
  action: "approved",
  responsible: { id: "admin-1", name: "Carla Montaño", role: "administrativo" },
  detail: null,
  evidence: { name: "diploma", extension: "pdf", mimeType: "application/pdf", size: 10 },
};

describe("useAuditEvents", () => {
  beforeEach(() => listEvents.mockReset());

  it("recorre las páginas en el orden del servidor y vuelve a la primera al cambiar los filtros", async () => {
    listEvents.mockResolvedValue({ ok: true, data: { items: [EVENT], total: 25, page: 1, limit: 10 } });
    const { wrapper } = createQueryWrapper();
    const { result, rerender } = renderHook(({ filters }) => useAuditEvents(filters), { wrapper, initialProps: { filters: DEFAULT_AUDIT_FILTERS } });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({ total: 25, totalPages: 3, from: 1, to: 10, hasPrevious: false, hasNext: true });

    act(() => result.current.goToNext());
    await waitFor(() => expect(listEvents).toHaveBeenLastCalledWith(2, DEFAULT_AUDIT_FILTERS));
    await waitFor(() => expect(result.current.from).toBe(11));

    act(() => result.current.goToPage(99));
    await waitFor(() => expect(listEvents).toHaveBeenLastCalledWith(3, DEFAULT_AUDIT_FILTERS));
    expect(result.current.page).toBe(3);

    const filtered = { ...DEFAULT_AUDIT_FILTERS, action: "rejected" as const };
    rerender({ filters: filtered });
    await waitFor(() => expect(listEvents).toHaveBeenLastCalledWith(1, filtered));
    expect(result.current.page).toBe(1);
  });

  it("expone el mensaje y el código del error, sin confundirlo con una lista vacía", async () => {
    listEvents.mockResolvedValue({ ok: false, status: 401, message: "Tu sesión expiró. Inicia sesión de nuevo." });
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useAuditEvents(DEFAULT_AUDIT_FILTERS), { wrapper });

    await waitFor(() => expect(result.current.error).toBe("Tu sesión expiró. Inicia sesión de nuevo."));
    expect(result.current.errorStatus).toBe(401);
    expect(result.current.items).toEqual([]);
  });
});

describe("useEvidenceViewer", () => {
  const createObjectURL = vi.fn(() => "blob:evidencia");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    getEvidenceBlob.mockReset();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    vi.mocked(toast.error).mockClear();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("abre el documento del evento y libera la URL al cerrar", async () => {
    getEvidenceBlob.mockResolvedValue({ ok: true, data: new Blob(["%PDF"]) });
    const { result } = renderHook(() => useEvidenceViewer());

    await act(() => result.current.open(EVENT));

    expect(getEvidenceBlob).toHaveBeenCalledWith("evt-1");
    expect(result.current.opened).toEqual({ event: EVENT, url: "blob:evidencia" });
    act(() => result.current.close());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:evidencia");
    expect(result.current.opened).toBeNull();
  });

  it("un evento sin documento no hace ninguna petición", async () => {
    const { result } = renderHook(() => useEvidenceViewer());
    await act(() => result.current.open({ ...EVENT, evidence: null }));
    expect(getEvidenceBlob).not.toHaveBeenCalled();
  });

  it("si falla, avisa en español y no abre un visor vacío", async () => {
    getEvidenceBlob.mockResolvedValue({ ok: false, status: 403, message: "No tienes permiso para ver el registro de auditoría." });
    const { result } = renderHook(() => useEvidenceViewer());

    await act(() => result.current.open(EVENT));

    expect(toast.error).toHaveBeenCalledWith("No tienes permiso para ver el registro de auditoría.");
    expect(result.current.opened).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("no repite la petición mientras se prepara la misma apertura y descarta la respuesta si se cerró", async () => {
    let resolve: (value: { ok: true; data: Blob }) => void = () => undefined;
    getEvidenceBlob.mockReturnValue(new Promise((done) => (resolve = done)));
    const { result } = renderHook(() => useEvidenceViewer());

    act(() => void result.current.open(EVENT));
    await waitFor(() => expect(result.current.loadingId).toBe("evt-1"));
    act(() => void result.current.open(EVENT));
    expect(getEvidenceBlob).toHaveBeenCalledOnce();

    act(() => result.current.close());
    await act(async () => resolve({ ok: true, data: new Blob(["%PDF"]) }));
    expect(result.current.opened).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("libera la URL al desmontar", async () => {
    getEvidenceBlob.mockResolvedValue({ ok: true, data: new Blob(["%PDF"]) });
    const { result, unmount } = renderHook(() => useEvidenceViewer());
    await act(() => result.current.open(EVENT));
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:evidencia");
  });
});
