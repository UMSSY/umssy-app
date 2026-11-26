import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubObjectUrls } from "../components/document/document-step-test-utils";
import { companyAccessRequestService } from "../services/company-access-request.service";
import type { ApiResult } from "../types/api-result.types";
import type { CompanyDocumentCorrectionFormProps } from "../types/company-document-correction-form-props.types";
import type { CompanyDocumentCorrectionResponse } from "../types/company-document-correction-response.types";
import { useCompanyDocumentCorrection } from "./use-company-document-correction";

vi.mock("../services/company-access-request.service", () => ({
  companyAccessRequestService: { resubmitDocument: vi.fn() },
}));

const send = vi.mocked(companyAccessRequestService.resubmitDocument);
const CODE = "EMP-2026-0001";
const TOKEN = `ccr1.${"x".repeat(43)}`;
const RESPONSE: ApiResult<CompanyDocumentCorrectionResponse> = { ok: true, data: { requestCode: CODE, status: "PENDING" } };
const file = (name = "carta.pdf") => new File(["%PDF-1"], name, { type: "application/pdf" });

function setup(overrides: Partial<CompanyDocumentCorrectionFormProps> = {}) {
  const props = {
    requestCode: CODE,
    token: TOKEN,
    onSubmitted: vi.fn(),
    onCancel: vi.fn(),
    onAuthorizationLost: vi.fn(),
    ...overrides,
  };
  return { ...renderHook(() => useCompanyDocumentCorrection(props)), props };
}

describe("useCompanyDocumentCorrection", () => {
  beforeEach(() => {
    send.mockReset();
    stubObjectUrls();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("seleccionar, quitar y cancelar solo cambian el estado local y liberan la vista previa", () => {
    const { result, props } = setup();
    act(() => result.current.selectFile(file()));
    expect(result.current.document).toMatchObject({ fileName: "carta.pdf", documentType: null });
    act(() => result.current.removeFile());
    expect(result.current.document).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    act(() => result.current.selectFile(file("otra.pdf")));
    act(() => result.current.cancel());
    expect(props.onCancel).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(send).not.toHaveBeenCalled();
  });

  it("impide enviar sin archivo", async () => {
    const { result } = setup();
    await act(() => result.current.submit());
    expect(result.current.fileError).toBe("Selecciona un documento antes de enviarlo.");
    expect(send).not.toHaveBeenCalled();
  });

  it.each([
    new File([], "empty.pdf", { type: "application/pdf" }),
    new File(["MZ"], "malo.exe", { type: "application/octet-stream" }),
    new File([new Uint8Array(10 * 1024 * 1024 + 1)], "grande.pdf", { type: "application/pdf" }),
  ])("rechaza un archivo inválido sin vista previa ni envío", (selected) => {
    const { result } = setup();
    act(() => result.current.selectFile(selected));
    expect(result.current.fileError).not.toBeNull();
    expect(result.current.document).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("avisa si no puede preparar la vista previa", () => {
    vi.mocked(URL.createObjectURL).mockImplementation(() => { throw new Error("sin memoria"); });
    const { result } = setup();
    act(() => result.current.selectFile(file()));
    expect(result.current.fileError).toContain("No se pudo preparar la vista previa");
    expect(result.current.document).toBeNull();
  });

  it("envía una sola vez, informa el progreso y confirma al terminar", async () => {
    let finish: (value: typeof RESPONSE) => void = () => undefined;
    send.mockImplementation((_code, _token, _file, onProgress) => {
      onProgress?.(40);
      return new Promise((resolve) => { finish = resolve; });
    });
    const { result, props } = setup();
    act(() => result.current.selectFile(file()));

    let pending: Promise<void> = Promise.resolve();
    act(() => { pending = result.current.submit(); });
    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.progress).toBe(40);
    await act(() => result.current.submit());
    act(() => result.current.selectFile(file("otra.pdf")));
    act(() => result.current.removeFile());
    act(() => result.current.cancel());
    expect(send).toHaveBeenCalledTimes(1);
    expect(props.onCancel).not.toHaveBeenCalled();

    await act(async () => { finish(RESPONSE); await pending; });
    expect(props.onSubmitted).toHaveBeenCalledWith(RESPONSE.ok ? RESPONSE.data : null);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.document).toBeNull();
  });

  it("muestra el mensaje del servidor y permite reintentar", async () => {
    send.mockResolvedValueOnce({ ok: false, status: 409, fieldErrors: {}, message: "La empresa ya está registrada." });
    const { result, props } = setup();
    act(() => result.current.selectFile(file()));

    await act(() => result.current.submit());
    expect(result.current.submitError).toBe("La empresa ya está registrada.");
    expect(props.onSubmitted).not.toHaveBeenCalled();
    expect(result.current.document).not.toBeNull();

    send.mockResolvedValueOnce(RESPONSE);
    await act(() => result.current.submit());
    expect(props.onSubmitted).toHaveBeenCalledOnce();
  });

  it("avisa cuando el permiso ya no sirve", async () => {
    send.mockResolvedValue({ ok: false, status: 401, fieldErrors: {}, message: "vencido" });
    const { result, props } = setup();
    act(() => result.current.selectFile(file()));

    await act(() => result.current.submit());

    expect(props.onAuthorizationLost).toHaveBeenCalledOnce();
    expect(result.current.submitError).toBeNull();
  });

  it("no envía con un permiso malformado", async () => {
    const { result } = setup({ token: "sesion.jwt" });
    act(() => result.current.selectFile(file()));
    await act(() => result.current.submit());
    expect(result.current.submitError).toContain("venció o ya se usó");
    expect(send).not.toHaveBeenCalled();
  });

  it("un fallo inesperado deja un mensaje de reintento", async () => {
    send.mockRejectedValue(new Error("boom"));
    const { result } = setup();
    act(() => result.current.selectFile(file()));
    await act(() => result.current.submit());
    expect(result.current.submitError).toBe("No se pudo reenviar el documento. Inténtalo de nuevo.");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("no actualiza el estado si el componente se desmontó durante el envío", async () => {
    let finish: (value: typeof RESPONSE) => void = () => undefined;
    send.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { result, props, unmount } = setup();
    act(() => result.current.selectFile(file()));
    let pending: Promise<void> = Promise.resolve();
    act(() => { pending = result.current.submit(); });
    unmount();
    await act(async () => { finish(RESPONSE); await pending; });
    expect(props.onSubmitted).not.toHaveBeenCalled();
  });
});
