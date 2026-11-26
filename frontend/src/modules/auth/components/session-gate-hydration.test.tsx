import { StrictMode } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionGate } from "./session-gate";

const mocks = vi.hoisted(() => ({
  provideAuth: true,
  router: { replace: vi.fn() },
  auth: {
    isLoading: false,
    isAuthenticated: false,
    hydrateSession: vi.fn<() => Promise<boolean>>(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("@/shared/contexts/auth-context", () => ({
  useOptionalAuth: () => (mocks.provideAuth ? mocks.auth : null),
}));

vi.mock("@/shared/services/storage/access-token-storage", () => ({
  getAccessToken: () => null,
  isAccessTokenReady: () => true,
  subscribeAccessToken: () => () => {},
  waitForAccessTokenWrites: async () => {},
}));

vi.mock("@/shared/services/storage/cookie-session-state", () => ({
  hasCookieSession: () => false,
  subscribeCookieSession: () => () => {},
}));

vi.mock("../utils/safe-next-path", () => ({
  buildLoginUrl: () => "/login?next=%2Fprofile",
}));

vi.mock("../utils/session", () => ({ endSession: vi.fn() }));
vi.mock("../utils/session-cookie", () => ({ setSessionMarker: vi.fn() }));

function deferredSession() {
  let resolve!: (value: boolean) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<boolean>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function privatePage() {
  return (
    <SessionGate>
      <p>contenido privado</p>
    </SessionGate>
  );
}

describe("SessionGate backend hydration", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/profile");
    mocks.provideAuth = true;
    mocks.auth.isLoading = false;
    mocks.auth.isAuthenticated = false;
    mocks.auth.hydrateSession = vi
      .fn<() => Promise<boolean>>()
      .mockResolvedValue(false);
    mocks.router.replace.mockReset();
  });

  afterEach(() => cleanup());

  it("espera la respuesta demorada antes de redirigir una sesión inexistente", async () => {
    const pending = deferredSession();
    mocks.auth.hydrateSession.mockReturnValue(pending.promise);
    render(privatePage());

    await waitFor(() =>
      expect(mocks.auth.hydrateSession).toHaveBeenCalledTimes(1),
    );
    expect(screen.queryByText("contenido privado")).toBeNull();
    expect(mocks.router.replace).not.toHaveBeenCalled();

    await act(async () => pending.resolve(false));

    await waitFor(() =>
      expect(mocks.router.replace).toHaveBeenCalledWith(
        "/login?next=%2Fprofile",
      ),
    );
    expect(screen.queryByText("contenido privado")).toBeNull();
  });

  it("termina la comprobación cuando la consulta demorada falla", async () => {
    const pending = deferredSession();
    mocks.auth.hydrateSession.mockReturnValue(pending.promise);
    render(privatePage());

    await waitFor(() =>
      expect(mocks.auth.hydrateSession).toHaveBeenCalledTimes(1),
    );
    await act(async () => pending.reject(new Error("Network error")));

    await waitFor(() =>
      expect(mocks.router.replace).toHaveBeenCalledWith(
        "/login?next=%2Fprofile",
      ),
    );
  });

  it("muestra la página cuando el contexto confirma una sesión válida", async () => {
    const pending = deferredSession();
    mocks.auth.hydrateSession.mockReturnValue(pending.promise);
    const view = render(privatePage());

    await waitFor(() =>
      expect(mocks.auth.hydrateSession).toHaveBeenCalledTimes(1),
    );
    expect(mocks.router.replace).not.toHaveBeenCalled();

    await act(async () => {
      mocks.auth.isAuthenticated = true;
      pending.resolve(true);
    });
    view.rerender(privatePage());

    expect(screen.getByText("contenido privado")).toBeTruthy();
    expect(mocks.router.replace).not.toHaveBeenCalled();
  });

  it("conserva la consulta en curso aunque cambie la referencia del callback", async () => {
    const pending = deferredSession();
    const originalHydrate = mocks.auth.hydrateSession;
    originalHydrate.mockReturnValue(pending.promise);
    const view = render(privatePage());

    await waitFor(() => expect(originalHydrate).toHaveBeenCalledTimes(1));

    mocks.auth.hydrateSession = vi
      .fn<() => Promise<boolean>>()
      .mockResolvedValue(false);
    view.rerender(privatePage());
    await act(async () => pending.resolve(false));

    await waitFor(() =>
      expect(mocks.router.replace).toHaveBeenCalledWith(
        "/login?next=%2Fprofile",
      ),
    );
    expect(mocks.auth.hydrateSession).not.toHaveBeenCalled();
    expect(originalHydrate).toHaveBeenCalledTimes(1);
  });

  it("no redirige si el guard se desmonta antes de recibir la respuesta", async () => {
    const pending = deferredSession();
    mocks.auth.hydrateSession.mockReturnValue(pending.promise);
    const view = render(privatePage());

    await waitFor(() =>
      expect(mocks.auth.hydrateSession).toHaveBeenCalledTimes(1),
    );
    view.unmount();
    await act(async () => pending.resolve(false));

    expect(mocks.router.replace).not.toHaveBeenCalled();
  });

  it("consulta una sola vez y termina correctamente bajo StrictMode", async () => {
    const pending = deferredSession();
    mocks.auth.hydrateSession.mockReturnValue(pending.promise);
    render(<StrictMode>{privatePage()}</StrictMode>);

    await waitFor(() =>
      expect(mocks.auth.hydrateSession).toHaveBeenCalledTimes(1),
    );
    await act(async () => pending.resolve(false));

    await waitFor(() =>
      expect(mocks.router.replace).toHaveBeenCalledWith(
        "/login?next=%2Fprofile",
      ),
    );
    expect(mocks.auth.hydrateSession).toHaveBeenCalledTimes(1);
    expect(mocks.router.replace).toHaveBeenCalledTimes(1);
  });

  it("redirige sin consultar al backend si no hay proveedor de autenticación", async () => {
    mocks.provideAuth = false;
    render(privatePage());

    await waitFor(() =>
      expect(mocks.router.replace).toHaveBeenCalledWith(
        "/login?next=%2Fprofile",
      ),
    );
    expect(mocks.auth.hydrateSession).not.toHaveBeenCalled();
  });
});
