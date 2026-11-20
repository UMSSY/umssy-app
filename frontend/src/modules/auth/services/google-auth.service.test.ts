import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { googleAuthService, decodeGoogleIdToken } from "./google-auth.service";
import { apiClient } from "@/shared/services/api-client";
import { requestGoogleOAuth } from "../utils/google-oauth-redirect";

vi.mock("../utils/google-oauth-redirect", () => ({
  requestGoogleOAuth: vi.fn(),
}));

describe("googleAuthService redirect fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("uses the callback flow and preserves account linking when the Google SDK is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "qa.apps.googleusercontent.com");
    vi.stubGlobal("google", undefined);
    const profile = { email: "qa@gmail.com", idToken: "credential", credential: "credential" };
    vi.mocked(requestGoogleOAuth).mockResolvedValueOnce(profile);

    await expect(googleAuthService.promptSelectAccount({ intent: "link", accountEmail: "qa@gmail.com" })).resolves.toEqual(profile);
    expect(requestGoogleOAuth).toHaveBeenCalledWith("qa.apps.googleusercontent.com", { intent: "link", accountEmail: "qa@gmail.com" });
  });
});

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

  it("devuelve role_not_allowed cuando el rol no está permitido para vinculación (403)", async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          code: "ROLE_NOT_ASSIGNED",
          detail: "La vinculación con Google solo está permitida para estudiantes, titulados y mentores.",
        },
      },
    });

    const result = await googleAuthService.linkGoogleAccount(
      "admin@umss.edu",
      "admin@umss.edu"
    );

    expect(result).toEqual({
      success: false,
      reason: "role_not_allowed",
      message: "La vinculación con Google solo está permitida para estudiantes, titulados y mentores.",
    });
  });
});

describe("googleAuthService.loginWithGoogle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicia sesión exitosamente y extrae la sesión", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        accessToken: "jwt-token-xyz",
        roleTag: "titulado",
        roles: ["titulado"],
      },
    });

    const result = await googleAuthService.loginWithGoogle("dania@umss.edu", "id-token-123");

    expect(apiClient.post).toHaveBeenCalledWith("/auth/google/login", {
      email: "dania@umss.edu",
      credential: "id-token-123",
      idToken: "id-token-123",
    });
    expect(result).toEqual({
      success: true,
      session: {
        accessToken: "jwt-token-xyz",
        roleTag: "titulado",
        roles: ["titulado"],
      },
    });
  });

  it("devuelve role_not_allowed cuando el backend responde 403", async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          code: "ROLE_NOT_ASSIGNED",
          detail: "El acceso con Google solo está permitido para estudiantes, titulados y mentores.",
        },
      },
    });

    const result = await googleAuthService.loginWithGoogle("admin@umss.edu");

    expect(result).toEqual({
      success: false,
      reason: "role_not_allowed",
      message: "El acceso con Google solo está permitido para estudiantes, titulados y mentores.",
    });
  });

  it("devuelve not_registered cuando el backend responde 404 o 401", async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: {
        status: 404,
        data: { detail: "Esta cuenta de Google no está registrada en el sistema." },
      },
    });

    const result = await googleAuthService.loginWithGoogle("desconocido@gmail.com");

    expect(result).toEqual({
      success: false,
      reason: "not_registered",
      message: "Esta cuenta de Google no está registrada en el sistema.",
    });
  });

  it("devuelve server_error ante un fallo genérico o error de servidor", async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Server down"));

    const result = await googleAuthService.loginWithGoogle("dania@umss.edu");

    expect(result).toEqual({
      success: false,
      reason: "server_error",
      message: "Ocurrió un error al intentar iniciar sesión con Google.",
    });
  });
});

describe("googleAuthService.promptSelectAccount", () => {
  it("rechaza sin llamar a alert() si NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    await expect(googleAuthService.promptSelectAccount()).rejects.toThrow(
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado."
    );

    expect(alertSpy).not.toHaveBeenCalled();

    alertSpy.mockRestore();
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = originalEnv;
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


