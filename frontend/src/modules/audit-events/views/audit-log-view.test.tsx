import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { DEFAULT_AUDIT_FILTERS } from "../constants/audit-log.constants";
import { auditLogRecordsService } from "../services/audit-log-records.service";
import { auditLogService } from "../services/audit-log.service";
import type { AuditEvent } from "../types/audit-event.types";
import { getCurrentMonthPeriod } from "../utils/get-current-month-period";
import { AuditLogView } from "./audit-log-view";

// La pantalla arranca con el mes en curso como período
const INITIAL_FILTERS = { ...DEFAULT_AUDIT_FILTERS, ...getCurrentMonthPeriod() };

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), usePathname: () => "/backoffice/audit" }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const listEvents = vi.spyOn(auditLogService, "listEvents");
const getEvidenceBlob = vi.spyOn(auditLogService, "getEvidenceBlob");
const listResponsibles = vi.spyOn(auditLogRecordsService, "listResponsibles");
const exportCsv = vi.spyOn(auditLogRecordsService, "exportCsv");

const event = (index: number, overrides: Partial<AuditEvent> = {}): AuditEvent => ({
  id: `evt-${index}`,
  code: `EVT-2026-00000${index}`,
  occurredAt: "2026-09-22T15:41:00.000Z",
  request: { id: `req-${index}`, code: `SOL-2026-014${index}` },
  applicantName: `Persona ${index}`,
  action: "approved",
  responsible: { id: "admin-1", name: "Carla Montaño", role: "administrativo" },
  detail: "Documento revisado: Diploma académico.",
  evidence: { name: "diploma", extension: "pdf", mimeType: "application/pdf", size: 10 },
  ...overrides,
});

const page = (items: AuditEvent[], total = items.length) => ({ ok: true as const, data: { items, total, page: 1, limit: 10 } });

describe("AuditLogView", () => {
  beforeEach(() => {
    stubMatchMedia();
    listEvents.mockReset();
    getEvidenceBlob.mockReset();
    exportCsv.mockReset();
    listResponsibles.mockResolvedValue({ ok: true, data: [{ id: "admin-1", name: "Carla Montaño" }, { id: "system", name: "Sistema" }] });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("muestra el título, la descripción, el aviso de solo lectura y los eventos", async () => {
    listEvents.mockResolvedValue(page([event(1), event(2)], 2));
    renderWithQuery(<AuditLogView />);

    expect(screen.getByRole("heading", { name: "Registro de auditoría" })).toBeInTheDocument();
    expect(screen.getByText("Historial de cada solicitud: quién hizo cada acción, cuándo y con qué documento.")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("Registro de solo lectura");
    expect(screen.getByRole("note")).toHaveTextContent("no pueden editarse ni borrarse. Las horas están en hora de Bolivia (UTC-4).");
    expect(await screen.findAllByText("SOL-2026-0141")).not.toHaveLength(0);
    expect(screen.getByText("2 eventos en el período seleccionado")).toBeInTheDocument();
    expect(listEvents).toHaveBeenCalledWith(1, INITIAL_FILTERS);
  });

  it("no tiene acciones de editar, borrar ni dictamen", async () => {
    listEvents.mockResolvedValue(page([event(1)]));
    renderWithQuery(<AuditLogView />);
    await screen.findAllByText("SOL-2026-0141");
    expect(screen.queryByRole("button", { name: /editar|eliminar|borrar|aprobar|rechazar/i })).toBeNull();
  });

  it("un filtro de acción vuelve a la primera página y se envía al servidor", async () => {
    listEvents.mockResolvedValue(page([event(1)], 25));
    renderWithQuery(<AuditLogView />);
    await screen.findAllByText("SOL-2026-0141");

    fireEvent.click(screen.getAllByRole("button", { name: /Siguiente/ })[0]);
    await waitFor(() => expect(listEvents).toHaveBeenLastCalledWith(2, INITIAL_FILTERS));

    fireEvent.change(screen.getAllByLabelText("Desde")[0], { target: { value: "2026-09-01" } });
    await waitFor(() => expect(listEvents).toHaveBeenLastCalledWith(1, { ...INITIAL_FILTERS, from: "2026-09-01" }));
  });

  it("un periodo inválido muestra el error y no se envía", async () => {
    listEvents.mockResolvedValue(page([event(1)]));
    renderWithQuery(<AuditLogView />);
    await screen.findAllByText("SOL-2026-0141");

    fireEvent.change(screen.getAllByLabelText("Desde")[0], { target: { value: "2026-09-30" } });
    fireEvent.change(screen.getAllByLabelText("Hasta")[0], { target: { value: "2026-09-01" } });

    expect((await screen.findAllByText("La fecha final no puede ser anterior a la fecha inicial."))[0]).toBeInTheDocument();
    expect(listEvents).not.toHaveBeenCalledWith(1, expect.objectContaining({ to: "2026-09-01" }));
  });

  it("sin coincidencias muestra No se encontraron resultados y Limpiar filtros vuelve al mes en curso", async () => {
    listEvents.mockResolvedValue(page([]));
    renderWithQuery(<AuditLogView />);
    expect(await screen.findByText("No hay eventos registrados en el período")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpiar filtros" })).toBeNull();

    fireEvent.change(screen.getAllByLabelText("Desde")[0], { target: { value: "2026-09-01" } });
    expect(await screen.findByText("No se encontraron resultados")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Limpiar filtros" }).at(-1)!);
    expect(await screen.findByText("No hay eventos registrados en el período")).toBeInTheDocument();
    await waitFor(() => expect(listEvents).toHaveBeenLastCalledWith(1, INITIAL_FILTERS));
    const [day, month, year] = [INITIAL_FILTERS.from.slice(8), INITIAL_FILTERS.from.slice(5, 7), INITIAL_FILTERS.from.slice(0, 4)];
    expect(screen.getAllByLabelText("Desde")[0]).toHaveValue(`${day}/${month}/${year}`);
  });

  it("abre el documento del evento y al cerrar conserva la página y los filtros", async () => {
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:doc"), revokeObjectURL: vi.fn() });
    listEvents.mockResolvedValue(page([event(1)], 25));
    getEvidenceBlob.mockResolvedValue({ ok: true, data: new Blob(["%PDF"], { type: "application/pdf" }) });
    renderWithQuery(<AuditLogView />);
    await screen.findAllByText("SOL-2026-0141");

    fireEvent.change(screen.getAllByLabelText("Desde")[0], { target: { value: "2026-09-01" } });
    const filtered = { ...INITIAL_FILTERS, from: "2026-09-01" };
    await waitFor(() => expect(listEvents).toHaveBeenLastCalledWith(1, filtered));
    fireEvent.click(await screen.findByRole("button", { name: "Página 2" }));
    await waitFor(() => expect(listEvents).toHaveBeenLastCalledWith(2, filtered));

    fireEvent.click((await screen.findAllByRole("button", { name: "Ver documento del evento EVT-2026-000001" }))[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Documento del evento EVT-2026-000001")).toBeInTheDocument();
    expect(getEvidenceBlob).toHaveBeenCalledWith("evt-1");

    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "Página 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByLabelText("Desde")[0]).toHaveValue("01/09/2026");
  });

  it("Exportar CSV envía los filtros activos y queda ocupado mientras se prepara", async () => {
    listEvents.mockResolvedValue(page([event(1)], 124));
    let finish: (value: { ok: false; status: number; message: string }) => void = () => undefined;
    exportCsv.mockReturnValue(new Promise((done) => (finish = done)));
    renderWithQuery(<AuditLogView />);
    await screen.findAllByText("SOL-2026-0141");

    fireEvent.change(screen.getAllByLabelText("Desde")[0], { target: { value: "2026-09-01" } });
    await waitFor(() => expect(listEvents).toHaveBeenLastCalledWith(1, { ...INITIAL_FILTERS, from: "2026-09-01" }));

    const button = await screen.findByRole("button", { name: "Exportar a CSV los 124 eventos filtrados" });
    fireEvent.click(button);
    expect(exportCsv).toHaveBeenCalledWith({ ...INITIAL_FILTERS, from: "2026-09-01" });
    await waitFor(() => expect(button).toBeDisabled());
    fireEvent.click(button);
    expect(exportCsv).toHaveBeenCalledOnce();
    await act(async () => finish({ ok: false, status: 500, message: "No se pudo completar la operación." }));
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("un fallo de conexión se muestra como error con Reintentar, no como lista vacía", async () => {
    listEvents.mockResolvedValue({ ok: false, status: 0, message: "No se pudo conectar con el servidor. Inténtalo de nuevo." });
    renderWithQuery(<AuditLogView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor.");
    expect(screen.queryByText("No hay eventos registrados en el período")).toBeNull();
    listEvents.mockResolvedValue(page([event(1)]));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findAllByText("SOL-2026-0141")).not.toHaveLength(0);
  });
});
