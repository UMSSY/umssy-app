import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { googleAuthService } from "../services/google-auth.service";
import { useGoogleLogin } from "./use-google-login";

vi.mock("../services/google-auth.service", () => ({
  googleAuthService: { promptSelectAccount: vi.fn(), loginWithGoogle: vi.fn() },
}));

const prompt = vi.mocked(googleAuthService.promptSelectAccount);
const login = vi.mocked(googleAuthService.loginWithGoogle);
const session = { accessToken: "t", roleTag: "titulado" as const };

describe("useGoogleLogin", () => {
  const onSession = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    prompt.mockResolvedValue({ email: "dania@gmail.com", idToken: "cred" });
  });
  afterEach(cleanup);

  it("una cuenta vinculada inicia la sesión", async () => {
    login.mockResolvedValue({ success: true, session });
    const { result } = renderHook(() => useGoogleLogin(onSession));

    await act(() => result.current.start());

    expect(prompt).toHaveBeenCalledWith({ intent: "login" });
    expect(login).toHaveBeenCalledWith("dania@gmail.com", "cred");
    expect(onSession).toHaveBeenCalledWith(session);
    expect(result.current.linkRequest).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("sin credencial consulta solo con el correo", async () => {
    prompt.mockResolvedValue({ email: "dania@gmail.com" });
    login.mockResolvedValue({ success: true, session });
    const { result } = renderHook(() => useGoogleLogin(onSession));
    await act(() => result.current.start());
    expect(login).toHaveBeenCalledWith("dania@gmail.com");
  });

  it("una cuenta sin vincular guarda la solicitud de vinculación y no abre sesión", async () => {
    const link = { linkToken: "l", email: "dania@gmail.com", emailVerified: true };
    login.mockResolvedValue({ success: true, requiresLinking: true, link });
    const { result } = renderHook(() => useGoogleLogin(onSession));

    await act(() => result.current.start());

    expect(result.current.linkRequest).toEqual(link);
    expect(onSession).not.toHaveBeenCalled();

    act(() => result.current.clearLinkRequest());
    expect(result.current.linkRequest).toBeNull();
  });

  it.each(["not_registered", "role_not_allowed"] as const)("el rechazo %s abre la pantalla de acceso no permitido", async (reason) => {
    login.mockResolvedValue({ success: false, reason, message: "Tu solicitud aún no fue aprobada" });
    const { result } = renderHook(() => useGoogleLogin(onSession));

    await act(() => result.current.start());

    expect(result.current.accessDenied).toEqual({ reason, message: "Tu solicitud aún no fue aprobada" });
    act(() => result.current.clearAccessDenied());
    expect(result.current.accessDenied).toBeNull();
  });

  it("un error del servidor se muestra como mensaje", async () => {
    login.mockResolvedValue({ success: false, reason: "server_error", message: "" });
    const { result } = renderHook(() => useGoogleLogin(onSession));
    await act(() => result.current.start());
    expect(result.current.error).toBe("Ocurrió un error al intentar iniciar sesión con Google.");
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it("explica cuando falta el identificador de cliente de Google y no hace nada si se cierra la ventana", async () => {
    prompt.mockRejectedValueOnce(new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID no está configurado."));
    const { result } = renderHook(() => useGoogleLogin(onSession));
    await act(() => result.current.start());
    expect(result.current.error).toContain("no está disponible en este momento");

    prompt.mockRejectedValueOnce(new Error("User closed prompt"));
    await act(() => result.current.start());
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);

    prompt.mockResolvedValueOnce({ email: "" });
    await act(() => result.current.start());
    expect(login).not.toHaveBeenCalled();
  });

  it("limpia los estados anteriores al volver a empezar", async () => {
    login.mockResolvedValueOnce({ success: false, reason: "not_registered", message: "x" });
    const { result } = renderHook(() => useGoogleLogin(onSession));
    await act(() => result.current.start());
    expect(result.current.accessDenied).not.toBeNull();

    login.mockResolvedValueOnce({ success: true, session });
    await act(() => result.current.start());
    expect(result.current.accessDenied).toBeNull();
  });
});
