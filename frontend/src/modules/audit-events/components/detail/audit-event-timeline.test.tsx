import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { auditLogService } from "../../services/audit-log.service";
import type { AuditEventTimeline as AuditEventTimelineData } from "../../types/audit-event-timeline.types";
import { AuditEventTimeline } from "./audit-event-timeline";

const TIMELINE: AuditEventTimelineData = {
  requestCode: "SOL-2026-0018",
  focusedEventId: "evt-2",
  items: [
    { id: "evt-1", action: "submitted", occurredAt: "2026-11-07T09:53:00.000Z", actorName: "Xavier Daniel Soria Flores", actorRole: "titulado", detail: null },
    { id: "evt-2", action: "rejected", occurredAt: "2026-11-07T09:54:00.000Z", actorName: "Admin Uno", actorRole: "administrativo", detail: "Motivo: Documento ilegible" },
  ],
};

afterEach(() => cleanup());

describe("AuditEventTimeline", () => {
  it("lista el historial en orden y resalta el evento que se está viendo", async () => {
    vi.spyOn(auditLogService, "getEventTimeline").mockResolvedValue({ ok: true, data: structuredClone(TIMELINE) });

    renderWithQuery(<AuditEventTimeline eventId="evt-2" />);

    const section = await screen.findByRole("region", { name: "Historial de SOL-2026-0018" });
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Xavier Daniel Soria Flores");
    expect(items[1]).toHaveTextContent("Admin Uno");

    const focused = within(items[1]).getByText(/Admin Uno/);
    expect(focused.className).toContain("font-bold");
  });

  it("avisa cuando el historial no se pudo cargar", async () => {
    vi.spyOn(auditLogService, "getEventTimeline").mockResolvedValue({ ok: false, status: 500, message: "Error" });

    renderWithQuery(<AuditEventTimeline eventId="evt-2" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el historial");
  });
});
