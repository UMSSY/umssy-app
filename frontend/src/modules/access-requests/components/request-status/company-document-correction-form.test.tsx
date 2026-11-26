import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { companyAccessRequestService } from "../../services/company-access-request.service";
import { stubObjectUrls } from "../document/document-step-test-utils";
import { CompanyDocumentCorrectionForm } from "./company-document-correction-form";

vi.mock("../../services/company-access-request.service", () => ({
  companyAccessRequestService: { resubmitDocument: vi.fn() },
}));

const send = vi.mocked(companyAccessRequestService.resubmitDocument);
const TOKEN = `ccr1.${"x".repeat(43)}`;

function renderForm() {
  const props = {
    requestCode: "EMP-2026-0001",
    token: TOKEN,
    onSubmitted: vi.fn(),
    onCancel: vi.fn(),
    onAuthorizationLost: vi.fn(),
  };
  render(<CompanyDocumentCorrectionForm {...props} />);
  return props;
}

function chooseFile() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("No hay campo de archivo");
  fireEvent.change(input, { target: { files: [new File(["%PDF-1"], "carta.pdf", { type: "application/pdf" })] } });
}

describe("CompanyDocumentCorrectionForm", () => {
  beforeEach(() => {
    send.mockReset();
    stubObjectUrls();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("pide un archivo antes de enviar y no llama al servicio", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Enviar documento" }));
    expect(await screen.findByText("Selecciona un documento antes de enviarlo.")).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it("envía el archivo elegido y confirma al terminar", async () => {
    send.mockResolvedValue({ ok: true, data: { requestCode: "EMP-2026-0001", status: "PENDING" } });
    const props = renderForm();

    chooseFile();
    expect(await screen.findByText("carta.pdf")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Enviar documento" }));

    await waitFor(() => expect(props.onSubmitted).toHaveBeenCalledWith({ requestCode: "EMP-2026-0001", status: "PENDING" }));
    expect(send).toHaveBeenCalledWith("EMP-2026-0001", TOKEN, expect.any(File), expect.any(Function));
  });

  it("muestra el error del servidor sin cerrar el formulario", async () => {
    send.mockResolvedValue({ ok: false, status: 409, fieldErrors: {}, message: "La empresa ya está registrada." });
    const props = renderForm();

    chooseFile();
    await screen.findByText("carta.pdf");
    await userEvent.click(screen.getByRole("button", { name: "Enviar documento" }));

    expect(await screen.findByText("La empresa ya está registrada.")).toBeInTheDocument();
    expect(props.onSubmitted).not.toHaveBeenCalled();
  });

  it("quitar el archivo y cancelar vuelven al estado inicial", async () => {
    const props = renderForm();

    chooseFile();
    await userEvent.click(await screen.findByRole("button", { name: /Quitar/ }));
    expect(screen.queryByText("carta.pdf")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(props.onCancel).toHaveBeenCalledOnce();
  });
});
