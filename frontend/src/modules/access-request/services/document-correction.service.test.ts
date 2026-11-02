import { AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import type { DocumentType } from "../constants/document-types.constants";
import { accessRequestService } from "./access-request.service";

vi.mock("@/shared/services/api-client", () => ({ apiClient: { request: vi.fn() } }));

const request = vi.mocked(apiClient.request);
const CODE = "SOL-2026-0001";
const TOKEN = `dcr1.${"x".repeat(43)}`;
const file = () => new File(["%PDF-1"], "corregido.pdf", { type: "application/pdf" });
const ok = { requestCode: CODE, status: "pending" };

function reply(status: number, data: unknown) {
  request.mockResolvedValue({ status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } });
}

describe("accessRequestService.resubmitDocument", () => {
  beforeEach(() => request.mockReset());

  it("envía el archivo y tipo a B2 con autorización explícita y sin correo en la URL", async () => {
    reply(200, { statusCode: 200, ok: true, data: { ...ok, fullName: "No devolver", token: "No devolver" } });
    const selected = file();
    await expect(accessRequestService.resubmitDocument(CODE, TOKEN, selected, "national_title")).resolves.toEqual({ ok: true, data: ok });
    const config = request.mock.calls[0][0];
    expect(config).toMatchObject({ method: "post", url: `/access-requests/${CODE}/resubmit`, headers: { Authorization: `Bearer ${TOKEN}` } });
    const form = config?.data as FormData;
    expect(form.get("file")).toBe(selected);
    expect(form.get("documentType")).toBe("national_title");
    expect(form.has("email")).toBe(false);
    expect(form.has("token")).toBe(false);
    expect(config?.headers).not.toHaveProperty("Content-Type");
    expect(config?.url).not.toContain(TOKEN);
  });

  it("normaliza el código y acepta una respuesta directa válida", async () => {
    reply(200, ok);
    await expect(accessRequestService.resubmitDocument(" sol-2026-0001 ", TOKEN, file(), "academic_diploma")).resolves.toEqual({ ok: true, data: ok });
  });

  it.each(["", "session.jwt.token", `dcr1.${"x".repeat(42)}`, `${TOKEN}\n`])("no consulta B2 sin un permiso de corrección válido: %s", async (token) => {
    expect(await accessRequestService.resubmitDocument(CODE, token, file(), "national_title")).toMatchObject({ ok: false, status: 401 });
    expect(request).not.toHaveBeenCalled();
  });

  it("no construye rutas con un código inválido", async () => {
    expect(await accessRequestService.resubmitDocument("../other", TOKEN, file(), "national_title")).toMatchObject({ ok: false, status: 400 });
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    { name: "empty.pdf", type: "application/pdf", size: 0, message: "El archivo está vacío." },
    { name: "large.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1, message: "El archivo supera el máximo de 10 MB." },
    { name: "other.exe", type: "application/octet-stream", size: 2, message: "Formato no permitido. Solo se aceptan archivos JPG, PNG o PDF." },
  ])("valida $name antes de enviar", async ({ name, type, size, message }) => {
    const selected = new File([new Uint8Array(size)], name, { type });
    expect(await accessRequestService.resubmitDocument(CODE, TOKEN, selected, "national_title")).toMatchObject({ ok: false, message });
    expect(request).not.toHaveBeenCalled();
  });

  it("rechaza la ausencia de archivo o un tipo documental ajeno al catálogo", async () => {
    expect(await accessRequestService.resubmitDocument(CODE, TOKEN, undefined as unknown as File, "national_title")).toMatchObject({ ok: false, status: 400 });
    expect(await accessRequestService.resubmitDocument(CODE, TOKEN, file(), "other" as DocumentType)).toMatchObject({ ok: false, status: 400 });
    expect(request).not.toHaveBeenCalled();
  });

  it.each([400, 401, 403, 404, 409, 413, 429, 500])("el error HTTP %s no expone mensajes internos ni datos personales", async (status) => {
    reply(status, { detail: "PRIVADO ana@example.com", fullName: "Ana Pérez", token: TOKEN });
    const result = await accessRequestService.resubmitDocument(CODE, TOKEN, file(), "national_title");
    expect(result).toMatchObject({ ok: false, status, fieldErrors: {} });
    expect(JSON.stringify(result)).not.toMatch(/PRIVADO|ana@example|Ana Pérez|dcr1/);
  });

  it.each([{ requestCode: "SOL-2026-9999", status: "pending" }, { requestCode: CODE, status: "approved" }, {}, "<html>error</html>", { statusCode: 200, ok: false, data: ok }])(
    "no confirma un envío con una respuesta incorrecta: %j", async (body) => {
      reply(200, body);
      expect(await accessRequestService.resubmitDocument(CODE, TOKEN, file(), "national_title")).toMatchObject({ ok: false, status: 0 });
    },
  );

  it("maneja un fallo de red y permite volver a utilizar el permiso", async () => {
    request.mockRejectedValueOnce(new Error("network internal message"));
    expect(await accessRequestService.resubmitDocument(CODE, TOKEN, file(), "national_title")).toMatchObject({ ok: false, status: 0 });
    reply(200, ok);
    expect(await accessRequestService.resubmitDocument(CODE, TOKEN, file(), "national_title")).toEqual({ ok: true, data: ok });
  });

  it("informa el progreso acotado y espera la respuesta del servidor para confirmar", async () => {
    reply(200, ok);
    const progress = vi.fn();
    await accessRequestService.resubmitDocument(CODE, TOKEN, file(), "national_title", progress);
    const report = request.mock.calls[0][0]?.onUploadProgress;
    report?.({ loaded: 50, total: 100, bytes: 50, lengthComputable: true });
    report?.({ loaded: 500, total: 100, bytes: 500, lengthComputable: true });
    report?.({ loaded: 1, bytes: 1, lengthComputable: false });
    expect(progress.mock.calls).toEqual([[50], [100]]);
  });
});
