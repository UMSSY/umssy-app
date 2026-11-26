import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubObjectUrls } from "../components/document/document-step-test-utils";
import { companyAccessRequestService } from "../services/company-access-request.service";
import type { CompanyRequestStatusResponse } from "../types/company-request-status.types";
import { discardCompanyCorrectionToken } from "../utils/company-correction-token-store";
import { CompanyMyRequestView } from "./company-my-request-view";

vi.mock("../services/company-access-request.service", () => ({
  companyAccessRequestService: { getPublicStatus: vi.fn(), resubmitDocument: vi.fn() },
}));

const getStatus = vi.mocked(companyAccessRequestService.getPublicStatus);
const resubmit = vi.mocked(companyAccessRequestService.resubmitDocument);
const CODE = "EMP-2026-0001";
const EMAIL = "contacto@techandina.com";
const TOKEN = `ccr1.${"x".repeat(43)}`;
const OBSERVED: CompanyRequestStatusResponse = {
  requestCode: CODE,
  companyName: "Tech Andina",
  status: "OBSERVED",
  submittedAt: "2026-11-16T15:00:00.000Z",
  reviewedAt: "2026-11-17T15:00:00.000Z",
  rejectionReason: null,
  reason: "[Documento] Carta ilegible",
  canResubmit: true,
};

function openLink(withToken: boolean) {
  window.history.replaceState(null, "", `/request-access/status?code=${CODE}&email=${EMAIL}${withToken ? `#token=${TOKEN}` : ""}`);
}

async function renderView(props: { requestCode?: string | null; email?: string | null } = { requestCode: CODE, email: EMAIL }) {
  await act(async () => { render(<CompanyMyRequestView {...props} />); });
}

function chooseFile() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("No hay campo de archivo");
  const file = new File(["%PDF-1"], "carta.pdf", { type: "application/pdf" });
  act(() => {
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("CompanyMyRequestView", () => {
  beforeEach(() => {
    getStatus.mockReset();
    resubmit.mockReset();
    stubObjectUrls();
    discardCompanyCorrectionToken();
  });
  afterEach(() => {
    cleanup();
    discardCompanyCorrectionToken();
    vi.unstubAllGlobals();
    window.history.replaceState(null, "", "/");
  });

  it("sin código válido avisa que el enlace está incompleto y no consulta", async () => {
    await renderView({ requestCode: "SOL-2026-0001", email: EMAIL });
    expect(screen.getByRole("alert")).toHaveTextContent("El enlace está incompleto o no es válido.");
    expect(getStatus).not.toHaveBeenCalled();
  });

  it("con el correo en el enlace consulta sola y muestra la solicitud observada con su motivo", async () => {
    openLink(false);
    getStatus.mockResolvedValue({ ok: true, data: OBSERVED });
    await renderView();

    expect(getStatus).toHaveBeenCalledWith(CODE, EMAIL);
    expect(await screen.findByLabelText("Motivo de la revisión")).toHaveTextContent("[Documento] Carta ilegible");
    expect(screen.getByRole("button", { name: "Subir un nuevo documento" })).toBeDisabled();
  });

  it("sin correo en el enlace pide el correo antes de consultar", async () => {
    getStatus.mockResolvedValue({ ok: true, data: OBSERVED });
    await renderView({ requestCode: CODE, email: null });

    expect(getStatus).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText("Correo electrónico"), EMAIL);
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(getStatus).toHaveBeenCalledWith(CODE, EMAIL);
    expect(await screen.findByLabelText("Motivo de la revisión")).toBeInTheDocument();
  });

  it("si la consulta falla muestra el error y vuelve a pedir el correo", async () => {
    getStatus.mockResolvedValue({ ok: false, status: 404, fieldErrors: {}, message: "no" });
    await renderView();

    expect(await screen.findByText("No se pudo consultar la solicitud")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
  });

  it("muestra el límite de intentos cuando el servidor responde 429", async () => {
    getStatus.mockResolvedValue({ ok: false, status: 429, fieldErrors: {}, message: "limit" });
    await renderView();
    expect(await screen.findByText(/demasiados intentos/)).toBeInTheDocument();
  });

  it("descarta una respuesta de otra solicitud", async () => {
    getStatus.mockResolvedValue({ ok: true, data: { ...OBSERVED, requestCode: "EMP-2026-9999" } });
    await renderView();
    expect(await screen.findByText("No se pudo consultar la solicitud")).toBeInTheDocument();
    expect(screen.queryByLabelText("Motivo de la revisión")).not.toBeInTheDocument();
  });

  it("una solicitud en revisión no ofrece corrección", async () => {
    getStatus.mockResolvedValue({ ok: true, data: { ...OBSERVED, status: "PENDING", canResubmit: false, reason: null } });
    await renderView();
    expect(await screen.findByRole("status")).toHaveTextContent("Estado: En revisión");
    expect(screen.queryByRole("button", { name: "Subir un nuevo documento" })).not.toBeInTheDocument();
  });

  it("con el permiso del correo permite corregir, retira el permiso de la URL y confirma el reenvío", async () => {
    openLink(true);
    getStatus.mockResolvedValue({ ok: true, data: OBSERVED });
    resubmit.mockResolvedValue({ ok: true, data: { requestCode: CODE, status: "PENDING" } });
    await renderView();

    expect(window.location.href).not.toContain(TOKEN);
    await userEvent.click(await screen.findByRole("button", { name: "Subir un nuevo documento" }));
    chooseFile();
    await screen.findByText("carta.pdf");
    await userEvent.click(screen.getByRole("button", { name: "Enviar documento" }));

    await waitFor(() => expect(screen.getByText("Documento enviado correctamente")).toBeInTheDocument());
    expect(resubmit).toHaveBeenCalledWith(CODE, TOKEN, expect.any(File), expect.any(Function));
    expect(screen.getByText("Tu documento fue enviado, volverá a revisión.")).toBeInTheDocument();
    expect(screen.getByText("Estado: En revisión")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Subir un nuevo documento" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Motivo de la revisión")).not.toBeInTheDocument();
  });

  it("cancelar la corrección vuelve al detalle de la solicitud", async () => {
    openLink(true);
    getStatus.mockResolvedValue({ ok: true, data: OBSERVED });
    await renderView();

    await userEvent.click(await screen.findByRole("button", { name: "Subir un nuevo documento" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByRole("button", { name: "Subir un nuevo documento" })).toBeEnabled();
    expect(resubmit).not.toHaveBeenCalled();
  });

  it("si el permiso venció o ya se usó lo avisa y deja de ofrecer la corrección", async () => {
    openLink(true);
    getStatus.mockResolvedValue({ ok: true, data: OBSERVED });
    resubmit.mockResolvedValue({ ok: false, status: 401, fieldErrors: {}, message: "vencido" });
    await renderView();

    await userEvent.click(await screen.findByRole("button", { name: "Subir un nuevo documento" }));
    chooseFile();
    await screen.findByText("carta.pdf");
    await userEvent.click(screen.getByRole("button", { name: "Enviar documento" }));

    expect(await screen.findByText("No se pudo autorizar la corrección")).toBeInTheDocument();
    expect(screen.getByText(/venció o ya se usó/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir un nuevo documento" })).toBeDisabled();
  });

  it("muestra los errores de archivo del servidor dentro del formulario", async () => {
    openLink(true);
    getStatus.mockResolvedValue({ ok: true, data: { ...OBSERVED, status: "REJECTED", reason: "Firma no válida" } });
    resubmit.mockResolvedValue({ ok: false, status: 413, fieldErrors: {}, message: "El archivo supera el máximo de 10 MB." });
    await renderView();

    await userEvent.click(await screen.findByRole("button", { name: "Subir un nuevo documento" }));
    chooseFile();
    await screen.findByText("carta.pdf");
    await userEvent.click(screen.getByRole("button", { name: "Enviar documento" }));

    expect(await screen.findByText("El archivo supera el máximo de 10 MB.")).toBeInTheDocument();
  });
});
