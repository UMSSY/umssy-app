import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubObjectUrls } from "../components/document/document-step-test-utils";
import { accessRequestService } from "../services/access-request.service";
import type { ApiResult } from "../types/access-request.types";
import type { DocumentCorrectionFormProps, DocumentCorrectionResponse } from "../types/document-correction.types";
import { useDocumentCorrection } from "./use-document-correction";

vi.mock("../services/access-request.service", () => ({ accessRequestService: { resubmitDocument: vi.fn() } }));

const send = vi.mocked(accessRequestService.resubmitDocument);
const CODE = "SOL-2026-0001";
const TOKEN = `dcr1.${"x".repeat(43)}`;
const RESPONSE: ApiResult<DocumentCorrectionResponse> = { ok: true, data: { requestCode: CODE, status: "pending" } };
const file = (name = "nuevo.pdf") => new File(["%PDF-1"], name, { type: "application/pdf" });

function setup(overrides: Partial<DocumentCorrectionFormProps> = {}) {
  const props = { requestCode: CODE, token: TOKEN, initialDocumentType: "national_title" as const, onSubmitted: vi.fn(), onCancel: vi.fn(), ...overrides };
  return { ...renderHook(() => useDocumentCorrection(props)), props };
}

describe("useDocumentCorrection", () => {
  beforeEach(() => {
    send.mockReset();
    stubObjectUrls();
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("seleccionar, quitar y cancelar solo cambian el estado local y liberan la vista previa", () => {
    const { result, props } = setup();
    act(() => result.current.selectFile(file()));
    expect(result.current.document?.fileName).toBe("nuevo.pdf");
    expect(send).not.toHaveBeenCalled();
    act(() => result.current.removeFile());
    expect(result.current.document).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    act(() => result.current.selectFile(file("otro.pdf")));
    act(() => result.current.cancel());
    expect(props.onCancel).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(send).not.toHaveBeenCalled();
  });

  it("impide enviar sin archivo o sin tipo documental y permite corregirlo", async () => {
    const { result } = setup({ initialDocumentType: null });
    await act(() => result.current.submit());
    expect(result.current.fileError).toBe("Selecciona un documento antes de enviarlo.");
    expect(result.current.typeError).toBe("Elige el tipo de documento.");
    expect(send).not.toHaveBeenCalled();
    act(() => result.current.selectFile(file()));
    act(() => result.current.selectType("academic_diploma"));
    expect(result.current.typeError).toBeNull();
    expect(result.current.fileError).toBeNull();
  });

  it.each([
    new File([], "empty.pdf", { type: "application/pdf" }),
    new File(["MZ"], "bad.exe", { type: "application/octet-stream" }),
    new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.pdf", { type: "application/pdf" }),
  ])("rechaza un archivo inválido sin preparar una vista previa ni enviar", (selected) => {
    const { result } = setup();
    act(() => result.current.selectFile(selected));
    expect(result.current.fileError).not.toBeNull();
    expect(result.current.document).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("solo confirma una vez y bloquea cambios, cancelación y segundos envíos mientras espera", async () => {
    let finish!: (value: ApiResult<DocumentCorrectionResponse>) => void;
    send.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { result, props } = setup();
    const selected = file();
    act(() => result.current.selectFile(selected));
    let pending!: Promise<void>;
    act(() => { pending = result.current.submit(); void result.current.submit(); });
    expect(send).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(true);
    act(() => {
      result.current.selectFile(file("otro.pdf"));
      result.current.selectType("academic_diploma");
      result.current.removeFile();
      result.current.cancel();
    });
    expect(result.current.document?.fileName).toBe(selected.name);
    expect(result.current.documentType).toBe("national_title");
    expect(props.onCancel).not.toHaveBeenCalled();
    expect(props.onSubmitted).not.toHaveBeenCalled();
    act(() => send.mock.calls[0][4]?.(65));
    expect(result.current.progress).toBe(65);
    await act(async () => { finish(RESPONSE); await pending; });
    expect(props.onSubmitted).toHaveBeenCalledWith(RESPONSE.ok ? RESPONSE.data : undefined);
    expect(result.current.isSubmitting).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
  });

  it("conserva archivo y permiso tras un fallo y permite reintentar", async () => {
    send.mockResolvedValueOnce({ ok: false, status: 500, message: "Inténtalo de nuevo.", fieldErrors: {} }).mockResolvedValueOnce(RESPONSE);
    const { result, props } = setup();
    const selected = file();
    act(() => result.current.selectFile(selected));
    await act(() => result.current.submit());
    expect(result.current.document?.fileName).toBe(selected.name);
    expect(result.current.submitError).toBe("Inténtalo de nuevo.");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    expect(props.onSubmitted).not.toHaveBeenCalled();
    await act(() => result.current.submit());
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1].slice(0, 4)).toEqual([CODE, TOKEN, selected, "national_title"]);
    expect(props.onSubmitted).toHaveBeenCalledOnce();
  });

  it("una excepción no deja bloqueado el formulario", async () => {
    send.mockRejectedValueOnce(new Error("internal"));
    const { result } = setup();
    act(() => result.current.selectFile(file()));
    await act(() => result.current.submit());
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBe("No se pudo reenviar el documento. Inténtalo de nuevo.");
    expect(result.current.document).not.toBeNull();
  });

  it("no utiliza el correo ni una sesión como permiso de reemplazo", async () => {
    const { result } = setup({ token: "session.jwt" });
    act(() => result.current.selectFile(file()));
    await act(() => result.current.submit());
    expect(result.current.submitError).toContain("No se pudo autorizar");
    expect(send).not.toHaveBeenCalled();
  });

  it("libera el archivo al desmontar y descarta una respuesta tardía", async () => {
    let finish!: (value: ApiResult<DocumentCorrectionResponse>) => void;
    send.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { result, props, unmount } = setup();
    act(() => result.current.selectFile(file()));
    let pending!: Promise<void>;
    act(() => { pending = result.current.submit(); });
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    await act(async () => { finish(RESPONSE); await pending; });
    expect(props.onSubmitted).not.toHaveBeenCalled();
  });

  it("maneja un fallo al crear la vista previa sin subir el archivo", () => {
    vi.mocked(URL.createObjectURL).mockImplementationOnce(() => { throw new Error("preview"); });
    const { result } = setup();
    act(() => result.current.selectFile(file()));
    expect(result.current.fileError).toContain("No se pudo preparar la vista previa");
    expect(send).not.toHaveBeenCalled();
  });
});
