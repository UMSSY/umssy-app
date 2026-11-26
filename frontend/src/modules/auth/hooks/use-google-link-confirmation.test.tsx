import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { googleAuthService } from "../services/google-auth.service";
import { startSession } from "../utils/session";
import { useGoogleLinkConfirmation } from "./use-google-link-confirmation";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("../utils/session", () => ({ startSession: vi.fn() }));
vi.mock("../services/google-auth.service", () => ({ googleAuthService: { confirmLink: vi.fn() } }));

const confirmLink = vi.mocked(googleAuthService.confirmLink);
const link = { linkToken: "link-token", email: "dania@gmail.com", emailVerified: true };
const session = { accessToken: "session-token", roleTag: "titulado" as const, roles: ["titulado" as const] };

describe("useGoogleLinkConfirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(startSession).mockResolvedValue();
  });
  afterEach(cleanup);

  it("empieza pendiente y no llama al servidor hasta confirmar", () => {
    const { result } = renderHook(() => useGoogleLinkConfirmation({ link }));
    expect(result.current.status).toBe("pending");
    expect(result.current.error).toBeNull();
    expect(confirmLink).not.toHaveBeenCalled();
  });

  it("al confirmar vincula, abre la sesión y espera a «Ir al inicio» para navegar", async () => {
    confirmLink.mockResolvedValue({ success: true, session });
    const onSessionStarted = vi.fn();
    const { result } = renderHook(() => useGoogleLinkConfirmation({ link, nextPath: "/profile", onSessionStarted }));

    await act(() => result.current.confirm());

    expect(confirmLink).toHaveBeenCalledWith("link-token");
    expect(onSessionStarted).toHaveBeenCalledOnce();
    expect(startSession).toHaveBeenCalledWith("session-token");
    expect(result.current.status).toBe("success");
    expect(replace).not.toHaveBeenCalled();

    act(() => result.current.continueToHome());
    expect(replace).toHaveBeenCalledWith("/profile");
  });

  it("continuar sin sesión no navega", () => {
    const { result } = renderHook(() => useGoogleLinkConfirmation({ link }));
    act(() => result.current.continueToHome());
    expect(replace).not.toHaveBeenCalled();
  });

  it("muestra «vinculando» mientras espera y no permite una segunda confirmación", async () => {
    let finish: (value: Awaited<ReturnType<typeof confirmLink>>) => void = () => undefined;
    confirmLink.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useGoogleLinkConfirmation({ link }));

    let first: Promise<void> = Promise.resolve();
    act(() => { first = result.current.confirm(); });
    expect(result.current.status).toBe("linking");
    expect(result.current.isLinking).toBe(true);
    await act(() => result.current.confirm());
    expect(confirmLink).toHaveBeenCalledTimes(1);

    await act(async () => { finish({ success: true, session }); await first; });
    expect(result.current.status).toBe("success");
    await act(() => result.current.confirm());
    expect(confirmLink).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["expired", "Vuelve a iniciar con Google", false],
    ["already_linked", "Esta cuenta de Google ya está vinculada a otro usuario.", false],
    ["role_not_allowed", "Rol no permitido", false],
    ["server_error", "No se pudo vincular la cuenta de Google. Inténtalo de nuevo.", true],
  ] as const)("el error %s se muestra y %s reintento", async (kind, message, canRetry) => {
    confirmLink.mockResolvedValue({ success: false, reason: kind, message });
    const { result } = renderHook(() => useGoogleLinkConfirmation({ link }));

    await act(() => result.current.confirm());

    expect(result.current.status).toBe("error");
    expect(result.current.error).toEqual({ kind, message });
    expect(result.current.canRetry).toBe(canRetry);
    expect(startSession).not.toHaveBeenCalled();
  });

  it("permite reintentar tras un error del servidor", async () => {
    confirmLink.mockResolvedValueOnce({ success: false, reason: "server_error", message: "falló" });
    const { result } = renderHook(() => useGoogleLinkConfirmation({ link }));
    await act(() => result.current.confirm());
    expect(result.current.canRetry).toBe(true);

    confirmLink.mockResolvedValueOnce({ success: true, session });
    await act(() => result.current.confirm());
    expect(result.current.status).toBe("success");
    expect(result.current.error).toBeNull();
  });

  it("un fallo inesperado deja un error del servidor", async () => {
    confirmLink.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useGoogleLinkConfirmation({ link }));
    await act(() => result.current.confirm());
    expect(result.current.error?.kind).toBe("server_error");
  });

  it("nunca guarda el linkToken en el almacenamiento del navegador", async () => {
    confirmLink.mockResolvedValue({ success: true, session });
    const { result } = renderHook(() => useGoogleLinkConfirmation({ link }));
    await act(() => result.current.confirm());
    expect(JSON.stringify({ ...window.localStorage })).not.toContain("link-token");
    expect(JSON.stringify({ ...window.sessionStorage })).not.toContain("link-token");
  });
});
