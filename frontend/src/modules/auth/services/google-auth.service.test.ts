import { describe, expect, it, vi, beforeEach } from "vitest";
import { googleAuthService, decodeGoogleIdToken } from "./google-auth.service";
import { apiClient } from "@/shared/services/api-client";

vi.mock("@/shared/services/api-client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe("googleAuthService.linkGoogleAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza la vinculación con email_mismatch si los correos no coinciden", async () => {
    const result = await googleAuthService.linkGoogleAccount(
      "usuario@gmail.com",
      "otro@gmail.com"
    );

    expect(result).toEqual({
      success: false,
      reason: "email_mismatch",
      message: "Esta cuenta de Google no coincide con el correo registrado.",
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("devuelve éxito cuando el backend confirma que la cuenta se vinculó", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { ok: true, detail: "Cuenta vinculada exitosamente." },
    });

    const result = await googleAuthService.linkGoogleAccount(
      "usuario@gmail.com",
      "USUARIO@GMAIL.COM "
    );

    expect(apiClient.post).toHaveBeenCalledWith("/auth/google/link", {
      email: "usuario@gmail.com",
      googleEmail: "usuario@gmail.com",
    });
    expect(result).toEqual({
      success: true,
      message: "Cuenta vinculada exitosamente.",
    });
  });

  it("devuelve error si la respuesta del backend indica ok: false", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { ok: false, detail: "El correo ya está vinculado a otra cuenta." },
    });

    const result = await googleAuthService.linkGoogleAccount(
      "usuario@gmail.com",
      "usuario@gmail.com"
    );

    expect(result).toEqual({
      success: false,
      reason: "server_error",
      message: "El correo ya está vinculado a otra cuenta.",
    });
  });

  it("no simula éxito y devuelve server_error si la petición al servidor falla (ej. 404 o 500)", async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: {
        status: 404,
        data: { detail: "Endpoint no encontrado." },
      },
    });

    const result = await googleAuthService.linkGoogleAccount(
      "usuario@gmail.com",
      "usuario@gmail.com"
    );

    expect(result.success).toBe(false);
    expect(result.reason).toBe("server_error");
    expect(result.message).toBe("Endpoint no encontrado.");
  });

  it("devuelve un mensaje claro cuando ocurre un error de red", async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Network Error"));

    const result = await googleAuthService.linkGoogleAccount(
      "usuario@gmail.com",
      "usuario@gmail.com"
    );

    expect(result.success).toBe(false);
    expect(result.reason).toBe("server_error");
    expect(result.message).toBe(
      "No se pudo conectar con el servidor para vincular la cuenta. Inténtalo de nuevo."
    );
  });
});

describe("decodeGoogleIdToken", () => {
  it("decodifica el payload de un ID Token JWT de Google correctamente", () => {
    const payload = {
      email: "dania@umss.edu",
      name: "Dania Gomez",
      picture: "https://photo.url/avatar.jpg",
      sub: "1234567890",
    };
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const fakeJwt = `header.${b64Payload}.signature`;

    const decoded = decodeGoogleIdToken(fakeJwt);
    expect(decoded).toEqual({
      email: "dania@umss.edu",
      name: "Dania Gomez",
      picture: "https://photo.url/avatar.jpg",
      sub: "1234567890",
    });
  });

  it("devuelve objeto vacío si el token no tiene el formato adecuado", () => {
    expect(decodeGoogleIdToken("invalid-token")).toEqual({});
  });
});
