import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessRequestService } from "@/modules/access-requests/services/access-request.service";
import { companyAccessRequestService } from "@/modules/access-requests/services/company-access-request.service";
import MyRequestPage from "./page";

vi.mock("@/modules/access-requests/services/access-request.service", () => ({
  accessRequestService: {
    getRequestStatus: vi.fn(),
  },
}));

vi.mock("@/modules/access-requests/services/company-access-request.service", () => ({
  companyAccessRequestService: {
    getPublicStatus: vi.fn(),
  },
}));

const getStatus = vi.mocked(accessRequestService.getRequestStatus);
const getCompanyStatus = vi.mocked(companyAccessRequestService.getPublicStatus);

describe("/request-access/status", () => {
  beforeEach(() => {
    getStatus.mockReset();
    getCompanyStatus.mockReset();
  });
  afterEach(cleanup);

  it("recibe code del enlace y muestra únicamente la verificación por correo", async () => {
    render(await MyRequestPage({
      searchParams: Promise.resolve({ code: "SOL-2026-0001" }),
    }));

    expect(screen.getByRole("heading", {
      level: 1,
      name: "Revisión de la carrera",
    })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("");
    expect(screen.queryByLabelText("Código de solicitud")).not.toBeInTheDocument();
    expect(getStatus).not.toHaveBeenCalled();
  });

  it.each([
    undefined,
    "",
    "OTRO-2026-0001",
    ["SOL-2026-0001"],
    ["SOL-2026-0001", "SOL-2026-0002"],
  ].map((code) => ({ code })))("no ofrece una consulta manual con una identificación inválida: $code", async ({ code }) => {
    render(await MyRequestPage({
      searchParams: Promise.resolve({ code }),
    }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El enlace está incompleto o no es válido.",
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(getStatus).not.toHaveBeenCalled();
  });

  it("un código de empresa abre la vista de empresa y consulta con el correo del enlace", async () => {
    getCompanyStatus.mockResolvedValue({
      ok: true,
      data: {
        requestCode: "EMP-2026-0001",
        companyName: "Tech Andina",
        status: "OBSERVED",
        submittedAt: null,
        reviewedAt: null,
        rejectionReason: null,
        reason: "[Documento] Carta ilegible",
        canResubmit: true,
      },
    });

    render(await MyRequestPage({
      searchParams: Promise.resolve({ code: "EMP-2026-0001", email: "contacto@techandina.com" }),
    }));

    expect(screen.getByRole("heading", { level: 1, name: "Mi solicitud de empresa" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Motivo de la revisión")).toHaveTextContent("Carta ilegible");
    expect(getCompanyStatus).toHaveBeenCalledWith("EMP-2026-0001", "contacto@techandina.com");
    expect(getStatus).not.toHaveBeenCalled();
  });

  it("un código de empresa sin correo en el enlace pide el correo y no consulta", async () => {
    render(await MyRequestPage({
      searchParams: Promise.resolve({ code: "EMP-2026-0001", email: ["a@b.com", "c@d.com"] }),
    }));

    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("");
    expect(getCompanyStatus).not.toHaveBeenCalled();
    expect(getStatus).not.toHaveBeenCalled();
  });
});
