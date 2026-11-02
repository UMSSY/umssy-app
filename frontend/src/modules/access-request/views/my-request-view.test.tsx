import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessRequestService } from "../services/access-request.service";
import type {
  ApiResult,
  RequestStatusResponse,
} from "../types/access-request.types";
import { MyRequestView } from "./my-request-view";

vi.mock("../services/access-request.service", () => ({
  accessRequestService: {
    getRequestStatus: vi.fn(),
  },
}));

const getStatus = vi.mocked(accessRequestService.getRequestStatus);
const CODE = "SOL-2026-0001";
const REJECTED_REQUEST: RequestStatusResponse = {
  requestCode: CODE,
  status: "rejected",
  fullName: "Ana Pérez",
  submittedAt: "2026-10-05T15:00:00.000Z",
  reviewedAt: "2026-10-06T10:00:00.000Z",
  rejectionReason: [
    "Documento ilegible",
    "El nombre y el número del título no se leen.",
    "Sube el PDF original o una foto con más luz.",
  ].join("\n"),
  document: null,
};

async function submitEmail(email = "ana@umss.edu.bo") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Correo electrónico"), email);
  await user.click(screen.getByRole("button", { name: "Continuar" }));
}

describe("MyRequestView", () => {
  beforeEach(() => {
    getStatus.mockReset();
  });
  afterEach(cleanup);

  it.each([undefined, null, "", "OTRO-2026-0001"])(
    "no ofrece consulta manual ni consulta B1 con un enlace incompleto o inválido: %j",
    (requestCode) => {
      render(<MyRequestView requestCode={requestCode} />);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "El enlace está incompleto o no es válido.",
      );
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.queryByText("Necesitamos otro documento")).not.toBeInTheDocument();
      expect(getStatus).not.toHaveBeenCalled();
    },
  );

  it("muestra la estructura existente y solicita solo correo sin consultar automáticamente", () => {
    render(<MyRequestView requestCode={CODE} />);

    expect(screen.getByRole("heading", {
      level: 1,
      name: "Revisión de la carrera",
    })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: "Mi solicitud" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.queryByLabelText("Código de solicitud")).not.toBeInTheDocument();
    expect(getStatus).not.toHaveBeenCalled();
  });

  it("consulta B1 con el código del enlace y el correo normalizado, y muestra el diseño rechazado", async () => {
    getStatus.mockResolvedValueOnce({ ok: true, data: REJECTED_REQUEST });
    render(<MyRequestView requestCode=" sol-2026-0001 " />);

    await submitEmail("ANA@UMSS.EDU.BO");

    expect(await screen.findByRole("heading", {
      name: "Necesitamos otro documento",
    })).toBeInTheDocument();
    expect(getStatus).toHaveBeenCalledTimes(1);
    expect(getStatus).toHaveBeenCalledWith(CODE, "ana@umss.edu.bo");
    expect(screen.getByText(CODE)).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Documento ilegible")).toBeInTheDocument();
    expect(screen.getByText(/El nombre y el número del título no se leen/)).toHaveTextContent(
      "Sube el PDF original o una foto con más luz.",
    );
    expect(screen.getByText(/Revisado por la Secretaría,/)).toHaveTextContent(
      "Revisado por la Secretaría, 6 oct, 06:00",
    );
    expect(screen.getByRole("heading", {
      name: "Antes de volver a subirlo",
    })).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Subir un nuevo documento",
    })).toBeDisabled();
    expect(screen.getByRole("button", {
      name: "Contactar a la carrera",
    })).toBeDisabled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it.each([
    { status: "draft", label: "Borrador" },
    { status: "pending", label: "En revisión" },
    { status: "in_review", label: "En revisión" },
    { status: "approved", label: "Aprobada" },
  ])("conserva el detalle de $status sin exponer datos del rechazo", async ({ status, label }) => {
    getStatus.mockResolvedValueOnce({
      ok: true,
      data: { ...REJECTED_REQUEST, status },
    });
    render(<MyRequestView requestCode={CODE} />);

    await submitEmail();

    expect(await screen.findByRole("status")).toHaveTextContent("Estado: " + label);
    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();
    expect(screen.queryByText("Documento ilegible")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", {
      name: "Antes de volver a subirlo",
    })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: "Subir un nuevo documento",
    })).not.toBeInTheDocument();
  });

  it.each([0, 400, 403, 404, 500])(
    "muestra el mismo error genérico para un error %s y no expone el mensaje del servicio",
    async (status) => {
      getStatus.mockResolvedValueOnce({
        ok: false,
        status,
        fieldErrors: {},
        message: "INTERNAL Ana Pérez privado@ejemplo.com Documento ilegible",
      });
      render(<MyRequestView requestCode={CODE} />);

      await submitEmail("incorrecto@ejemplo.com");

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Revisa el correo e inténtalo de nuevo.",
      );
      expect(getStatus).toHaveBeenCalledTimes(1);
      expect(getStatus).toHaveBeenCalledWith(CODE, "incorrecto@ejemplo.com");
      expect(document.body.textContent).not.toMatch(/INTERNAL|Ana Pérez|privado@ejemplo.com|Documento ilegible/);
      expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    },
  );

  it("controla una excepción de red y permite reintentar con un correo corregido", async () => {
    getStatus.mockRejectedValueOnce(new Error("INTERNAL privado@ejemplo.com"));
    getStatus.mockResolvedValueOnce({ ok: true, data: REJECTED_REQUEST });
    const user = userEvent.setup();
    render(<MyRequestView requestCode={CODE} />);

    await submitEmail("incorrecto@ejemplo.com");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Revisa el correo e inténtalo de nuevo.",
    );
    expect(document.body.textContent).not.toContain("INTERNAL");

    await user.clear(screen.getByLabelText("Correo electrónico"));
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@umss.edu.bo");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getStatus).toHaveBeenCalledTimes(2);
    expect(getStatus).toHaveBeenLastCalledWith(CODE, "ana@umss.edu.bo");
  });

  it("mantiene la carga y evita duplicar la consulta", async () => {
    const pending = Promise.withResolvers<ApiResult<RequestStatusResponse>>();
    getStatus.mockReturnValueOnce(pending.promise);
    const user = userEvent.setup();
    render(<MyRequestView requestCode={CODE} />);

    await user.type(screen.getByLabelText("Correo electrónico"), "ana@umss.edu.bo");

    const form = screen.getByRole("form", {
      name: "Verificar correo de la solicitud",
    });

    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    expect(getStatus).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Consultando tu solicitud...");
    expect(screen.getByLabelText("Correo electrónico")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Consultando..." })).toBeDisabled();
    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();

    await act(async () => {
      pending.resolve({ ok: true, data: REJECTED_REQUEST });
      await pending.promise;
    });

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
  });

  it("rechaza una respuesta que pertenece a otra solicitud sin mostrar sus datos", async () => {
    getStatus.mockResolvedValueOnce({
      ok: true,
      data: { ...REJECTED_REQUEST, requestCode: "SOL-2026-9999" },
    });
    render(<MyRequestView requestCode={CODE} />);

    await submitEmail();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Revisa el correo e inténtalo de nuevo.",
    );
    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();
    expect(screen.queryByText("SOL-2026-9999")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
  });

  it("descarta datos y correo al cambiar de enlace", async () => {
    getStatus.mockResolvedValueOnce({ ok: true, data: REJECTED_REQUEST });
    const { rerender } = render(<MyRequestView requestCode={CODE} />);

    await submitEmail();
    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();

    rerender(<MyRequestView requestCode="SOL-2026-0002" />);

    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();
    expect(screen.queryByText(CODE)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("");
    expect(getStatus).toHaveBeenCalledTimes(1);
  });

  it("ignora la respuesta anterior si el enlace cambia durante la consulta", async () => {
    const pending = Promise.withResolvers<ApiResult<RequestStatusResponse>>();
    getStatus.mockReturnValueOnce(pending.promise);
    const { rerender } = render(<MyRequestView requestCode={CODE} />);

    await submitEmail();

    rerender(<MyRequestView requestCode="SOL-2026-0002" />);

    await act(async () => {
      pending.resolve({ ok: true, data: REJECTED_REQUEST });
      await pending.promise;
    });

    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    expect(getStatus).toHaveBeenCalledTimes(1);
  });
});
