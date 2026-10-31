import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessRequestService } from "@/modules/access-request/services/access-request.service";
import MyRequestPage from "./page";

vi.mock("@/modules/access-request/services/access-request.service", () => ({
  accessRequestService: {
    getRequestStatus: vi.fn(),
  },
}));

const getStatus = vi.mocked(accessRequestService.getRequestStatus);

describe("/request-access/status", () => {
  beforeEach(() => {
    getStatus.mockReset();
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
});
