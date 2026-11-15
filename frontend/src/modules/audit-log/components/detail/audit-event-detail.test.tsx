import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { auditLogService } from "../../services/audit-log.service";
import type { AuditEvent } from "../../types/audit-event.types";
import type { AuditEventDetail } from "../../types/audit-event-detail.types";
import { formatEvidenceSize } from "../../utils/format-evidence-size";
import { AuditEventDetailPanel } from "./audit-event-detail-panel";

const EVENT: AuditEvent = {
  id: "evt-2",
  code: "EVT-2026-000812",
  occurredAt: "2026-11-07T09:54:00.000Z",
  request: { id: "req-1", code: "SOL-2026-0018" },
  applicantName: "Xavier Daniel Soria Flores",
  action: "rejected",
  responsible: { id: "user-1", name: "Admin Uno", role: "administrativo" },
  detail: "Motivo: Documento ilegible",
  evidence: { name: "diploma-academico", extension: "pdf", mimeType: "application/pdf", size: 1258291 },
};

const DETAIL: AuditEventDetail = {
  id: "evt-2",
  code: "EVT-2026-000812",
  occurredAt: "2026-11-07T09:54:00.000Z",
  action: "rejected",
  request: { id: "req-1", code: "SOL-2026-0018" },
  applicant: { fullName: "Xavier Daniel Soria Flores", career: "Ingeniería de Sistemas", graduationYear: 2024 },
  responsible: { id: "user-1", name: "Admin Uno", role: "administrativo" },
  rejectionReason: "Documento ilegible",
  documentType: "Diploma académico",
  evidence: { name: "diploma-academico", extension: "pdf", mimeType: "application/pdf", size: 1258291 },
};

function mockDetail(detail: AuditEventDetail) {
  vi.spyOn(auditLogService, "getEventDetail").mockResolvedValue({ ok: true, data: detail });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AuditEventDetailPanel", () => {
  it("muestra el código del evento, la solicitud, la persona titulada y el responsable", async () => {
    mockDetail(DETAIL);
    renderWithQuery(<AuditEventDetailPanel event={EVENT} onClose={vi.fn()} />);

    expect(await screen.findByText("SOL-2026-0018")).toBeInTheDocument();
    expect(screen.getByText("Solo lectura · EVT-2026-000812")).toBeInTheDocument();
    expect(screen.getByText(/Ingeniería de Sistemas · Titulación 2024/)).toBeInTheDocument();
    expect(screen.getByText("Admin Uno")).toBeInTheDocument();
    expect(screen.getByText(/hora de Bolivia/)).toBeInTheDocument();
  });

  it("enlaza a la revisión de la solicitud", async () => {
    mockDetail(DETAIL);
    renderWithQuery(<AuditEventDetailPanel event={EVENT} onClose={vi.fn()} />);

    expect(await screen.findByRole("link", { name: /Abrir solicitud/ })).toHaveAttribute(
      "href",
      "/backoffice/solicitudes/req-1",
    );
  });

  it("muestra el motivo del rechazo y los datos del documento revisado", async () => {
    mockDetail(DETAIL);
    renderWithQuery(<AuditEventDetailPanel event={EVENT} onClose={vi.fn()} />);

    expect(await screen.findByText("MOTIVO DEL RECHAZO")).toBeInTheDocument();
    expect(screen.getByText("Documento ilegible")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Diploma académico · diploma-academico.pdf · ${formatEvidenceSize(1258291)}`))).toBeInTheDocument();
  });

  it("no muestra el motivo del rechazo cuando la acción es otra", async () => {
    mockDetail({ ...DETAIL, action: "approved", rejectionReason: null });
    renderWithQuery(<AuditEventDetailPanel event={{ ...EVENT, action: "approved" }} onClose={vi.fn()} />);

    expect(await screen.findByText("SOLICITUD")).toBeInTheDocument();
    expect(screen.queryByText("MOTIVO DEL RECHAZO")).not.toBeInTheDocument();
  });

  it("indica que no hay documento cuando el evento no tiene evidencia", async () => {
    mockDetail({ ...DETAIL, evidence: null, documentType: null });
    renderWithQuery(<AuditEventDetailPanel event={{ ...EVENT, evidence: null }} onClose={vi.fn()} />);

    const section = (await screen.findByText("DOCUMENTO REVISADO")).parentElement as HTMLElement;
    expect(within(section).getByText("Sin documento")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ver documento/ })).not.toBeInTheDocument();
  });

  it("recuerda que el evento no se puede editar ni borrar", async () => {
    mockDetail(DETAIL);
    renderWithQuery(<AuditEventDetailPanel event={EVENT} onClose={vi.fn()} />);

    expect(await screen.findByText("Este evento no se puede editar ni borrar.")).toBeInTheDocument();
  });

  it("avisa cuando el detalle no se pudo cargar", async () => {
    vi.spyOn(auditLogService, "getEventDetail").mockResolvedValue({ ok: false, status: 500, message: "Error" });
    renderWithQuery(<AuditEventDetailPanel event={EVENT} onClose={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el detalle del evento.");
  });

  it("no consulta nada mientras no hay evento seleccionado", () => {
    const request = vi.spyOn(auditLogService, "getEventDetail");
    renderWithQuery(<AuditEventDetailPanel event={null} onClose={vi.fn()} />);

    expect(request).not.toHaveBeenCalled();
  });
});
