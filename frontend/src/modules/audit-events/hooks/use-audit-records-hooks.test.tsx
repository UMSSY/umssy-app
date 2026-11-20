import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { DEFAULT_AUDIT_FILTERS } from "../constants/audit-log.constants";
import { auditLogRecordsService } from "../services/audit-log-records.service";
import { useAuditCsvExport } from "./use-audit-csv-export";
import { useAuditFilters } from "./use-audit-filters";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const exportCsv = vi.spyOn(auditLogRecordsService, "exportCsv");

const OCTOBER = { from: "2026-10-01", to: "2026-10-31" };

describe("useAuditFilters", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-24T12:00:00-04:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("arranca con el período del mes en curso sin contarlo como filtro activo", () => {
    const { result } = renderHook(() => useAuditFilters());

    expect(result.current.values).toMatchObject(OCTOBER);
    expect(result.current.filters).toEqual({ ...DEFAULT_AUDIT_FILTERS, ...OCTOBER });
    expect(result.current.activeCount).toBe(0);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("espera antes de aplicar la búsqueda e ignora textos de un solo carácter", () => {
    const { result } = renderHook(() => useAuditFilters());

    act(() => result.current.handlers.onSearchChange("S"));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.filters.search).toBe("");

    act(() => result.current.handlers.onSearchChange(" SOL-2026 "));
    expect(result.current.filters.search).toBe("");
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.filters.search).toBe("SOL-2026");
  });

  it("no envía una fecha mientras se escribe incompleta, pero la cuenta como filtro activo", () => {
    const { result } = renderHook(() => useAuditFilters());

    act(() => result.current.handlers.onFromChange("01/09"));
    expect(result.current.filters.from).toBe("");
    expect(result.current.activeCount).toBe(1);

    act(() => result.current.handlers.onFromChange("2026-09-01"));
    expect(result.current.filters.from).toBe("2026-09-01");
  });

  it("cuenta los filtros activos, valida el período y Limpiar vuelve a los valores iniciales con el mes en curso", () => {
    const { result } = renderHook(() => useAuditFilters());

    act(() => {
      result.current.handlers.onActionChange("rejected");
      result.current.handlers.onResponsibleChange("system");
      result.current.handlers.onFromChange("2026-09-30");
      result.current.handlers.onToChange("2026-09-01");
    });

    expect(result.current.activeCount).toBe(3);
    expect(result.current.periodError).toBe("La fecha final no puede ser anterior a la fecha inicial.");
    expect(result.current.filters).toEqual({ ...DEFAULT_AUDIT_FILTERS, action: "rejected", responsibleId: "system" });

    act(() => result.current.handlers.onClear());
    expect(result.current.filters).toEqual({ ...DEFAULT_AUDIT_FILTERS, ...OCTOBER });
    expect(result.current.values.searchInput).toBe("");
    expect(result.current.hasActiveFilters).toBe(false);
  });
});

describe("useAuditCsvExport", () => {
  const createObjectURL = vi.fn(() => "blob:csv");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    exportCsv.mockReset();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    vi.mocked(toast.error).mockClear();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("descarga el archivo con el nombre del servidor y libera la URL temporal", async () => {
    exportCsv.mockResolvedValue({ ok: true, data: { blob: new Blob(["a"]), fileName: "registro-auditoria-2026-10-22.csv" } });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const { result } = renderHook(() => useAuditCsvExport());

    await act(() => result.current.exportCsv(DEFAULT_AUDIT_FILTERS));

    expect(click).toHaveBeenCalledOnce();
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe("registro-auditoria-2026-10-22.csv");
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith("blob:csv"));
    expect(result.current.isExporting).toBe(false);
    click.mockRestore();
  });

  it("un error muestra el mensaje y no descarga nada", async () => {
    exportCsv.mockResolvedValue({ ok: false, status: 403, message: "No tienes permiso para ver el registro de auditoría." });
    const { result } = renderHook(() => useAuditCsvExport());

    await act(() => result.current.exportCsv(DEFAULT_AUDIT_FILTERS));

    expect(toast.error).toHaveBeenCalledWith("No tienes permiso para ver el registro de auditoría.");
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("evita descargas duplicadas mientras está ocupado", async () => {
    let finish: (value: { ok: false; status: number; message: string }) => void = () => undefined;
    exportCsv.mockReturnValue(new Promise((done) => (finish = done)));
    const { result } = renderHook(() => useAuditCsvExport());

    act(() => void result.current.exportCsv(DEFAULT_AUDIT_FILTERS));
    act(() => void result.current.exportCsv(DEFAULT_AUDIT_FILTERS));
    expect(exportCsv).toHaveBeenCalledOnce();
    expect(result.current.isExporting).toBe(true);

    await act(async () => finish({ ok: false, status: 500, message: "Error" }));
    expect(result.current.isExporting).toBe(false);
  });
});
