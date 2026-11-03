import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubObjectUrls } from "../components/document/document-step-test-utils";
import { accessRequestService } from "../services/access-request.service";
import type { ApiResult, RequestStatusResponse } from "../types/access-request.types";
import type { DocumentCorrectionResponse } from "../types/document-correction.types";
import { MyRequestView } from "./my-request-view";

vi.mock("../services/access-request.service", () => ({
  accessRequestService: {
    getRequestStatus: vi.fn(), resubmitDocument: vi.fn(), uploadDocument: vi.fn(),
    removeDocument: vi.fn(), createAccessRequest: vi.fn(),
  },
}));

const CODE = "SOL-2026-0001";
const TOKEN = `dcr1.${"x".repeat(43)}`;
const getStatus = vi.mocked(accessRequestService.getRequestStatus);
const send = vi.mocked(accessRequestService.resubmitDocument);
const REJECTED: RequestStatusResponse = {
  requestCode: CODE, status: "rejected", fullName: "Ana Pérez",
  submittedAt: "2026-10-05T15:00:00.000Z", reviewedAt: "2026-10-06T10:00:00.000Z",
  rejectionReason: "Documento ilegible\nEl nombre no se lee.",
  document: { type: "national_title", size: 10, mimeType: "application/pdf" },
};
const RESPONSE: ApiResult<DocumentCorrectionResponse> = { ok: true, data: { requestCode: CODE, status: "pending" } };
const file = (name = "nuevo.pdf", type = "application/pdf", content = "%PDF-1") => new File([content], name, { type });

async function openCorrection() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  await user.click(await screen.findByRole("button", { name: "Subir un nuevo documento" }));
  return user;
}

describe("F2 desde Mi solicitud", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    stubObjectUrls();
    window.history.replaceState({}, "", `/request-access/status?code=${CODE}#correctionToken=${TOKEN}`);
    getStatus.mockResolvedValue({ ok: true, data: REJECTED });
    send.mockResolvedValue(RESPONSE);
  });
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
    vi.unstubAllGlobals();
  });

  it("habilita el botón con un permiso y reutiliza la carga y la vista previa sin escribir al seleccionar", async () => {
    const { container } = render(<MyRequestView requestCode={CODE} />);
    const user = await openCorrection();
    expect(container.querySelector('[data-slot="document-dropzone"]')).toBeInTheDocument();
    const selected = file();
    await user.upload(screen.getByLabelText("Archivo del documento"), selected);
    expect(container.querySelector("object")).toHaveAttribute("data", "blob:preview-1");
    expect(screen.getByRole("link", { name: "Ver" })).toHaveAttribute("target", "_blank");
    expect(send).not.toHaveBeenCalled();
    expect(accessRequestService.uploadDocument).not.toHaveBeenCalled();
    expect(accessRequestService.removeDocument).not.toHaveBeenCalled();
    expect(accessRequestService.createAccessRequest).not.toHaveBeenCalled();
    expect(window.location.hash).toContain(TOKEN);
  });

  it("cancelar conserva el rechazo y el permiso y libera únicamente la vista previa local", async () => {
    render(<MyRequestView requestCode={CODE} />);
    const user = await openCorrection();
    await user.upload(screen.getByLabelText("Archivo del documento"), file());
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByRole("heading", { name: "Necesitamos otro documento" })).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(window.location.hash).toContain(TOKEN);
    expect(send).not.toHaveBeenCalled();
    expect(accessRequestService.removeDocument).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    expect(getStatus).toHaveBeenCalledTimes(1);
  });

  it("permite quitar, reemplazar y confirmar el archivo, mostrando pending solo al terminar B2", async () => {
    render(<MyRequestView requestCode={CODE} />);
    const user = await openCorrection();
    await user.upload(screen.getByLabelText("Archivo del documento"), file("primero.pdf"));
    await user.click(screen.getByRole("button", { name: "Quitar" }));
    const selected = file("corregido.pdf");
    await user.upload(screen.getByLabelText("Archivo del documento"), selected);
    expect(send).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Enviar documento" }));
    expect(await screen.findByText("Documento enviado correctamente")).toBeInTheDocument();
    expect(screen.getByText("Estado: En revisión")).toBeInTheDocument();
    expect(screen.getByText(CODE)).toBeInTheDocument();
    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();
    expect(screen.queryByText("Documento ilegible")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Subir un nuevo documento" })).not.toBeInTheDocument();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(CODE, TOKEN, selected, "national_title", expect.any(Function));
    expect(window.location.hash).toBe("");
  });

  it("muestra el error de falta de archivo y no confirma la corrección", async () => {
    render(<MyRequestView requestCode={CODE} />);
    const user = await openCorrection();
    await user.click(screen.getByRole("button", { name: "Enviar documento" }));
    expect(screen.getByText("Selecciona un documento antes de enviarlo.")).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it.each([
    { name: "bad.exe", type: "application/octet-stream", content: "MZ", message: "Formato no permitido. Solo se aceptan archivos JPG, PNG o PDF." },
    { name: "empty.pdf", type: "application/pdf", content: "", message: "El archivo está vacío." },
  ])("rechaza $name y permite volver a elegir", async ({ name, type, content, message }) => {
    render(<MyRequestView requestCode={CODE} />);
    const user = await openCorrection();
    const uploader = userEvent.setup({ applyAccept: false });
    await uploader.upload(screen.getByLabelText("Archivo del documento"), file(name, type, content));
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
    await user.upload(screen.getByLabelText("Archivo del documento"), file());
    expect(screen.getByText("nuevo.pdf")).toBeInTheDocument();
  });

  it("tras un fallo conserva el archivo y el permiso y permite reintentar", async () => {
    send.mockResolvedValueOnce({ ok: false, status: 500, fieldErrors: {}, message: "No se pudo reenviar el documento. Inténtalo de nuevo." }).mockResolvedValueOnce(RESPONSE);
    render(<MyRequestView requestCode={CODE} />);
    const user = await openCorrection();
    await user.upload(screen.getByLabelText("Archivo del documento"), file());
    await user.click(screen.getByRole("button", { name: "Enviar documento" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Inténtalo de nuevo");
    expect(screen.getByText("nuevo.pdf")).toBeInTheDocument();
    expect(window.location.hash).toContain(TOKEN);
    await user.click(screen.getByRole("button", { name: "Enviar documento" }));
    expect(await screen.findByText("Documento enviado correctamente")).toBeInTheDocument();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("bloquea dobles confirmaciones y mantiene los controles deshabilitados durante el envío", async () => {
    let finish!: (value: ApiResult<DocumentCorrectionResponse>) => void;
    send.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<MyRequestView requestCode={CODE} />);
    const user = await openCorrection();
    await user.upload(screen.getByLabelText("Archivo del documento"), file());
    const form = screen.getByRole("form", { name: "Corrección del documento" });
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    expect(send).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Quitar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.queryByText("Documento enviado correctamente")).not.toBeInTheDocument();
    await act(async () => { finish(RESPONSE); });
    expect(await screen.findByText("Documento enviado correctamente")).toBeInTheDocument();
  });

  it.each(["", "#correctionToken=session.jwt", `#correctionToken=${TOKEN}&correctionToken=${TOKEN}`])(
    "conserva la consulta de rechazo sin ofrecer escritura con permiso ausente o inválido: %s", async (hash) => {
      window.history.replaceState({}, "", `/request-access/status?code=${CODE}${hash}`);
      render(<MyRequestView requestCode={CODE} />);
      const user = userEvent.setup();
      await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
      await user.click(screen.getByRole("button", { name: "Continuar" }));
      expect(await screen.findByRole("button", { name: "Subir un nuevo documento" })).toBeDisabled();
      expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
      expect(send).not.toHaveBeenCalled();
    },
  );

  it("no toma el permiso desde parámetros de consulta", async () => {
    window.history.replaceState({}, "", `/request-access/status?code=${CODE}&correctionToken=${TOKEN}`);
    render(<MyRequestView requestCode={CODE} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByRole("button", { name: "Subir un nuevo documento" })).toBeDisabled();
  });

  it("con otro estado no ofrece corrección aunque el enlace tenga un permiso", async () => {
    getStatus.mockResolvedValueOnce({ ok: true, data: { ...REJECTED, status: "approved" } });
    render(<MyRequestView requestCode={CODE} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Estado: Aprobada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Subir un nuevo documento" })).not.toBeInTheDocument();
  });

  it("cambiar el permiso descarta la selección anterior y una respuesta tardía no muestra datos viejos", async () => {
    let finish!: (value: ApiResult<DocumentCorrectionResponse>) => void;
    send.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<MyRequestView requestCode={CODE} />);
    const user = await openCorrection();
    await user.upload(screen.getByLabelText("Archivo del documento"), file());
    await user.click(screen.getByRole("button", { name: "Enviar documento" }));
    act(() => {
      window.history.replaceState({}, "", `/request-access/status?code=${CODE}#correctionToken=dcr1.${"y".repeat(43)}`);
      window.dispatchEvent(new Event("hashchange"));
    });
    expect(await screen.findByRole("heading", { name: "Necesitamos otro documento" })).toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    await act(async () => { finish(RESPONSE); });
    expect(screen.queryByText("Documento enviado correctamente")).not.toBeInTheDocument();
    expect(window.location.hash).toContain("y".repeat(43));
  });
});
