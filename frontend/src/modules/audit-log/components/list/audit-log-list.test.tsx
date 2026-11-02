import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuditEvent } from "../../types/audit-event.types";
import { AuditEventCards } from "./audit-event-cards";
import { AuditEventTable } from "./audit-event-table";
import { AuditLogStatus } from "./audit-log-status";
import { AuditPagination } from "./audit-pagination";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }), usePathname: () => "/backoffice/audit" }));
vi.mock("@/modules/auth", () => ({ endSession: vi.fn(), buildLoginUrl: (path: string) => `/login?next=${path}` }));

const EVENTS: AuditEvent[] = [
  {
    id: "evt-1",
    code: "EVT-2026-000001",
    occurredAt: "2026-09-22T15:41:00.000Z",
    request: { id: "req-1", code: "SOL-2026-0141" },
    applicantName: "Andrea Camacho",
    action: "activation_code_sent",
    responsible: { id: null, name: "Sistema", role: "sistema" },
    detail: "Código de activación enviado a an•••@gmail.com.",
    evidence: null,
  },
  {
    id: "evt-2",
    code: "EVT-2026-000002",
    occurredAt: "fecha-rota",
    request: { id: "req-2", code: "" },
    applicantName: "",
    action: "rejected",
    responsible: { id: "admin-1", name: "Carla Montaño", role: "administrativo" },
    detail: null,
    evidence: { name: "diploma", extension: "pdf", mimeType: "application/pdf", size: 10 },
  },
];

afterEach(() => cleanup());

describe("AuditEventTable y AuditEventCards", () => {
  it.each([
    ["tabla", AuditEventTable],
    ["tarjetas", AuditEventCards],
  ])("en %s muestra los campos de la HU, hora de Bolivia y valores ausentes", (_name, List) => {
    render(<List items={EVENTS} loadingEvidenceId={null} onOpenEvidence={vi.fn()} />);

    expect(screen.getByText("Código de activación enviado")).toBeInTheDocument();
    expect(screen.getByText("Rechazada")).toBeInTheDocument();
    expect(screen.getByText("SOL-2026-0141")).toBeInTheDocument();
    expect(screen.getAllByText(/11:41/).length).toBeGreaterThan(0);
    expect(screen.getByText("Sin documento")).toBeInTheDocument();
    expect(screen.getAllByText("Sin dato").length).toBeGreaterThan(0);
  });

  it("los datos son de solo lectura: no hay campos editables ni botones de editar o borrar", () => {
    const { container } = render(<AuditEventTable items={EVENTS} loadingEvidenceId={null} onOpenEvidence={vi.fn()} />);
    expect(container.querySelector("input, textarea, select, form")).toBeNull();
    expect(screen.queryByRole("button", { name: /editar|eliminar|borrar|aprobar|rechazar/i })).toBeNull();
  });

  it("Ver documento abre la evidencia del evento seleccionado y muestra la carga", () => {
    const onOpenEvidence = vi.fn();
    const { rerender } = render(<AuditEventTable items={EVENTS} loadingEvidenceId={null} onOpenEvidence={onOpenEvidence} />);

    fireEvent.click(screen.getByRole("button", { name: "Ver documento del evento EVT-2026-000002" }));
    expect(onOpenEvidence).toHaveBeenCalledWith(EVENTS[1], expect.any(HTMLElement));

    rerender(<AuditEventTable items={EVENTS} loadingEvidenceId="evt-2" onOpenEvidence={onOpenEvidence} />);
    expect(screen.getByRole("button", { name: "Ver documento del evento EVT-2026-000002" })).toBeDisabled();
  });

  it("muestra esqueletos mientras carga", () => {
    render(<AuditEventTable items={[]} isLoading loadingEvidenceId={null} onOpenEvidence={vi.fn()} />);
    expect(screen.getAllByTestId("audit-skeleton-row")).toHaveLength(5);
    cleanup();
    render(<AuditEventCards items={[]} isLoading loadingEvidenceId={null} onOpenEvidence={vi.fn()} />);
    expect(screen.getAllByTestId("audit-skeleton-card")).toHaveLength(3);
  });
});

describe("AuditPagination", () => {
  const renderPagination = (page: number, totalPages: number) => {
    const handlers = { onPrevious: vi.fn(), onNext: vi.fn(), onPageChange: vi.fn() };
    render(
      <AuditPagination
        from={(page - 1) * 10 + 1}
        to={Math.min(page * 10, totalPages * 10)}
        total={totalPages * 10}
        page={page}
        totalPages={totalPages}
        hasPrevious={page > 1}
        hasNext={page < totalPages}
        {...handlers}
      />,
    );
    return handlers;
  };

  it("en escritorio muestra páginas numeradas, marca la actual y permite saltar a otra", () => {
    const { onPageChange } = renderPagination(1, 13);

    const nav = screen.getByRole("navigation", { name: "Paginación del registro de auditoría" });
    expect(screen.getByText("Mostrando 1-10 de 130 eventos")).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("button", { name: "Página 13" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Página anterior" })).toBeDisabled();
    fireEvent.click(within(nav).getByRole("button", { name: "Página 3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("en móvil ofrece Anterior y Siguiente y los deshabilita sin otra página", () => {
    const { onNext } = renderPagination(2, 2);

    const nav = screen.getByRole("navigation", { name: "Paginación del registro de auditoría en móvil" });
    expect(within(nav).getByText("Página 2 de 2")).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Siguiente" })).toBeDisabled();
    fireEvent.click(within(nav).getByRole("button", { name: "Anterior" }));
    expect(onNext).not.toHaveBeenCalled();
  });
});

describe("AuditLogStatus", () => {
  it("un error de conexión ofrece Reintentar", () => {
    const onRetry = vi.fn();
    render(<AuditLogStatus error="No se pudo conectar con el servidor." errorStatus={0} isEmpty={false} onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("una sesión vencida lleva a iniciar sesión y la falta de permiso no ofrece reintentar", () => {
    render(<AuditLogStatus error="Tu sesión expiró." errorStatus={401} isEmpty={false} onRetry={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(replace).toHaveBeenCalledWith("/login?next=/backoffice/audit");
    cleanup();
    render(<AuditLogStatus error="No tienes permiso." errorStatus={403} isEmpty={false} onRetry={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("distingue un período sin eventos de una búsqueda o filtros sin resultados", () => {
    const onClearFilters = vi.fn();
    render(<AuditLogStatus error={null} errorStatus={null} isEmpty onRetry={vi.fn()} />);
    expect(screen.getByText("No hay eventos registrados en el período")).toBeInTheDocument();
    cleanup();
    render(<AuditLogStatus error={null} errorStatus={null} isEmpty hasActiveFilters onRetry={vi.fn()} onClearFilters={onClearFilters} />);
    expect(screen.getByText("No se encontraron resultados")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });

  it("sin error ni lista vacía no muestra nada", () => {
    const { container } = render(<AuditLogStatus error={null} errorStatus={null} isEmpty={false} onRetry={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
