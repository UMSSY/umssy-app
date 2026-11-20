import { describe, expect, it } from "vitest";
import { isAuditEventDetail } from "./is-audit-event-detail";

const VALID_DETAIL = {
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

describe("isAuditEventDetail", () => {
  it("valida un detalle completo y correcto", () => {
    expect(isAuditEventDetail(VALID_DETAIL)).toBe(true);
  });

  it("acepta un detalle con evidencia válida", () => {
    const withEvidence = {
      ...VALID_DETAIL,
      evidence: {
        name: "diploma",
        extension: "pdf",
        mimeType: "application/pdf",
        size: 1024,
      },
    };
    expect(isAuditEventDetail(withEvidence)).toBe(true);
  });

  it("rechaza valores que no son registros", () => {
    expect(isAuditEventDetail(null)).toBe(false);
    expect(isAuditEventDetail("")).toBe(false);
    expect(isAuditEventDetail(123)).toBe(false);
  });

  it("rechaza si falta algún campo obligatorio", () => {
    expect(isAuditEventDetail({ ...VALID_DETAIL, id: undefined })).toBe(false);
    expect(isAuditEventDetail({ ...VALID_DETAIL, code: 123 })).toBe(false);
    expect(isAuditEventDetail({ ...VALID_DETAIL, applicant: null })).toBe(false);
    expect(
      isAuditEventDetail({
        ...VALID_DETAIL,
        applicant: { ...VALID_DETAIL.applicant, graduationYear: "2024" },
      }),
    ).toBe(false);
  });

  it("rechaza si la evidencia tiene tipos inválidos", () => {
    expect(
      isAuditEventDetail({
        ...VALID_DETAIL,
        evidence: { name: "test", size: "1024" },
      }),
    ).toBe(false);
  });
});
