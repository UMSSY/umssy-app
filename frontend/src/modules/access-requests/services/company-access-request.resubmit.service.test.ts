import { AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { companyAccessRequestService } from "./company-access-request.service";

vi.mock("@/shared/services/api-client", () => ({ apiClient: { request: vi.fn() } }));

const request = vi.mocked(apiClient.request);
const CODE = "EMP-2026-0001";
const TOKEN = `ccr1.${"x".repeat(43)}`;
const file = () => new File(["%PDF-1"], "carta.pdf", { type: "application/pdf" });
const ok = { requestCode: CODE, status: "PENDING" };

function reply(status: number, data: unknown) {
  request.mockResolvedValue({ status, data, statusText: "", headers: {}, config: { headers: new AxiosHeaders() } });
}

describe("companyAccessRequestService.getPublicStatus", () => {
  beforeEach(() => { request.mockReset(); });

  it("consulta el estado con el correo como parámetro", async () => {
    const body = { requestCode: CODE, status: "OBSERVED", canResubmit: true, reason: "[Documento] Ilegible" };
    reply(200, { statusCode: 200, ok: true, data: body });

    await expect(companyAccessRequestService.getPublicStatus(CODE, "a@b.com")).resolves.toEqual({ ok: true, data: body });
    expect(request.mock.calls[0][0]).toMatchObject({
      method: "get",
      url: `/company-access-requests/status/${CODE}`,
      params: { email: "a@b.com" },
    });
  });

  it("devuelve el mensaje del servidor cuando no encuentra la solicitud y distingue el límite de intentos", async () => {
    reply(404, { message: "No se encontró una solicitud con ese código y correo" });
    expect(await companyAccessRequestService.getPublicStatus(CODE, "a@b.com")).toMatchObject({
      ok: false,
      status: 404,
      message: "No se encontró una solicitud con ese código y correo",
    });

    reply(429, { detail: "Realizaste demasiados intentos.", code: "COMPANY_REQUEST_RATE_LIMIT" });
    expect(await companyAccessRequestService.getPublicStatus(CODE, "a@b.com")).toMatchObject({
      ok: false,
      status: 429,
      code: "COMPANY_REQUEST_RATE_LIMIT",
    });
  });
});

describe("companyAccessRequestService.resubmitDocument", () => {
  beforeEach(() => { request.mockReset(); });

  it("envía el archivo con autorización explícita, sin permiso ni correo en la URL ni en el formulario", async () => {
    reply(200, { statusCode: 200, ok: true, data: { ...ok, companyName: "No devolver" } });
    const selected = file();
    const progress = vi.fn();

    await expect(companyAccessRequestService.resubmitDocument(CODE, TOKEN, selected, progress)).resolves.toEqual({
      ok: true,
      data: ok,
    });

    const config = request.mock.calls[0][0];
    expect(config).toMatchObject({
      method: "post",
      url: `/company-access-requests/${CODE}/resubmit`,
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const form = config?.data as FormData;
    expect(form.get("file")).toBe(selected);
    expect(form.has("token")).toBe(false);
    expect(form.has("email")).toBe(false);
    expect(config?.url).not.toContain(TOKEN);

    config?.onUploadProgress?.({ loaded: 50, total: 100 } as never);
    config?.onUploadProgress?.({ loaded: 1, total: 0 } as never);
    expect(progress).toHaveBeenCalledTimes(1);
    expect(progress).toHaveBeenCalledWith(50);
  });

  it("normaliza el código y tolera que no haya callback de progreso", async () => {
    reply(200, ok);
    await expect(companyAccessRequestService.resubmitDocument(" emp-2026-0001 ", TOKEN, file())).resolves.toEqual({ ok: true, data: ok });
    request.mock.calls[0][0]?.onUploadProgress?.({ loaded: 1, total: 2 } as never);
  });

  it.each(["", "session.jwt.token", `dcr1.${"x".repeat(43)}`, `ccr1.${"x".repeat(42)}`])(
    "no consulta al servidor sin un permiso de corrección válido: %s",
    async (token) => {
      expect(await companyAccessRequestService.resubmitDocument(CODE, token, file())).toMatchObject({ ok: false, status: 401 });
      expect(request).not.toHaveBeenCalled();
    },
  );

  it("no construye rutas con un código inválido o de titulados", async () => {
    expect(await companyAccessRequestService.resubmitDocument("../otro", TOKEN, file())).toMatchObject({ ok: false, status: 400 });
    expect(await companyAccessRequestService.resubmitDocument("SOL-2026-0001", TOKEN, file())).toMatchObject({ ok: false, status: 400 });
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    { name: "empty.pdf", type: "application/pdf", size: 0, message: "El archivo está vacío." },
    { name: "large.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1, message: "El archivo supera el máximo de 10 MB." },
    { name: "otro.exe", type: "application/octet-stream", size: 2, message: "Formato no permitido. Solo se aceptan archivos JPG, PNG o PDF." },
  ])("valida $name antes de enviar", async ({ name, type, size, message }) => {
    const selected = new File([new Uint8Array(size)], name, { type });
    expect(await companyAccessRequestService.resubmitDocument(CODE, TOKEN, selected)).toMatchObject({ ok: false, message });
    expect(request).not.toHaveBeenCalled();
  });

  it("exige adjuntar el archivo", async () => {
    expect(await companyAccessRequestService.resubmitDocument(CODE, TOKEN, undefined as unknown as File)).toMatchObject({
      ok: false,
      status: 400,
      message: "Selecciona un documento antes de enviarlo.",
    });
  });

  it("traduce 401 y 429 a mensajes fijos y conserva el mensaje del servidor en los demás errores", async () => {
    reply(401, { detail: "PRIVADO", code: "COMPANY_DOCUMENT_CORRECTION_UNAUTHORIZED" });
    const unauthorized = await companyAccessRequestService.resubmitDocument(CODE, TOKEN, file());
    expect(unauthorized).toMatchObject({ ok: false, status: 401, code: "COMPANY_DOCUMENT_CORRECTION_UNAUTHORIZED" });
    expect(JSON.stringify(unauthorized)).not.toContain("PRIVADO");

    reply(429, { detail: "PRIVADO" });
    const limited = await companyAccessRequestService.resubmitDocument(CODE, TOKEN, file());
    expect(limited).toMatchObject({ ok: false, status: 429, code: "COMPANY_REQUEST_RATE_LIMIT" });
    expect(JSON.stringify(limited)).not.toContain("PRIVADO");

    reply(409, { detail: 'La empresa "Tech Andina" ya se encuentra registrada en la plataforma.', code: "COMPANY_REGISTRATION_CONFLICT" });
    expect(await companyAccessRequestService.resubmitDocument(CODE, TOKEN, file())).toMatchObject({
      ok: false,
      status: 409,
      message: 'La empresa "Tech Andina" ya se encuentra registrada en la plataforma.',
    });

    reply(413, {});
    expect(await companyAccessRequestService.resubmitDocument(CODE, TOKEN, file())).toMatchObject({ ok: false, status: 413 });
  });

  it("informa un error de conexión", async () => {
    request.mockRejectedValue(new Error("Network Error"));
    const result = await companyAccessRequestService.resubmitDocument(CODE, TOKEN, file());
    expect(result).toMatchObject({
      ok: false,
      status: 0,
      message: "Error de conexión con el servidor.",
    });
  });

  it.each([{ requestCode: "EMP-2026-9999", status: "PENDING" }, { requestCode: CODE, status: "APPROVED" }, {}])(
    "no confirma un envío con una respuesta incorrecta: %j",
    async (body) => {
      reply(200, body);
      expect(await companyAccessRequestService.resubmitDocument(CODE, TOKEN, file())).toMatchObject({ ok: false, status: 0 });
    },
  );
});
