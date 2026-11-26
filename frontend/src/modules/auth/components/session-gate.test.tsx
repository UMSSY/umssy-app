import "@/shared/testing/indexed-db.mock";
import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from "@/shared/services/storage/access-token-storage";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/shared/contexts/auth-context";
import { clearCookieSessionState } from "@/shared/services/storage/cookie-session-state";
import { apiClient } from "@/shared/services/api-client";
import { hasSessionMarker, setSessionMarker } from "../utils/session-cookie";
import { SessionGate } from "./session-gate";

const { route } = vi.hoisted(() => ({ route: { pathname: "/profile" } }));
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useRouter: () => ({ replace }),
}));

function renderGate() {
  return render(
    <SessionGate>
      <p>contenido privado</p>
    </SessionGate>,
  );
}

describe("SessionGate", () => {
  beforeEach(() => window.history.replaceState({}, "", "/profile?tab=cv"));
  afterEach(() => {
    cleanup();
    clearAccessToken();
    clearCookieSessionState();
    document.cookie = "umssy_session=; Max-Age=0; Path=/";
    document.cookie = "umssy_has_session=; Max-Age=0; Path=/";
    replace.mockReset();
    route.pathname = "/profile";
    window.history.replaceState({}, "", "/");
  });

  it("con token muestra el contenido, no redirige y mantiene la cookie", async () => {
    await saveAccessToken("token-de-prueba");
    renderGate();

    expect(screen.getByText("contenido privado")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(hasSessionMarker()).toBe(true);
  });

  it("sin token (pestaña nueva con la cookie vieja) borra la cookie, lleva al login con next y no muestra el contenido", async () => {
    setSessionMarker();
    renderGate();

    expect(screen.queryByText("contenido privado")).toBeNull();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?next=%2Fprofile%3Ftab%3Dcv"));
    expect(hasSessionMarker()).toBe(false);
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("en Mis pases sin sesión lleva al login con la ruta pedida", async () => {
    route.pathname = "/events/my-passes";
    window.history.replaceState({}, "", "/events/my-passes");
    renderGate();

    expect(screen.queryByText("contenido privado")).toBeNull();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?next=%2Fevents%2Fmy-passes"));
  });

  it("un 401 del backend cierra la sesión y lleva al login", async () => {
    await saveAccessToken("token-de-prueba");
    renderGate();

    await expect(
      apiClient.get("/algo", {
        adapter: (config) => Promise.reject(Object.assign(new Error("no autorizado"), { isAxiosError: true, config, response: { status: 401 } })),
      }),
    ).rejects.toThrow("no autorizado");

    expect(getAccessToken()).toBeNull();
    expect(hasSessionMarker()).toBe(false);
    expect(replace).toHaveBeenCalledWith("/login?next=%2Fprofile%3Ftab%3Dcv");
  });

  it("otros errores no cierran la sesión", async () => {
    await saveAccessToken("token-de-prueba");
    renderGate();

    await expect(
      apiClient.get("/algo", {
        adapter: (config) => Promise.reject(Object.assign(new Error("fallo"), { isAxiosError: true, config, response: { status: 500 } })),
      }),
    ).rejects.toThrow("fallo");

    expect(getAccessToken()).toBe("token-de-prueba");
    expect(replace).not.toHaveBeenCalled();
  });

  it("el interceptor central sigue invalidando la sesión después de desmontar el guard", async () => {
    await saveAccessToken("token-de-prueba");
    const { unmount } = renderGate();
    unmount();

    await expect(
      apiClient.get("/algo", {
        adapter: (config) => Promise.reject(Object.assign(new Error("no autorizado"), { isAxiosError: true, config, response: { status: 401 } })),
      }),
    ).rejects.toThrow();

    expect(getAccessToken()).toBeNull();
  });

  it("hidrata la sesión desde el backend cuando el almacenamiento inicia sin token en memoria", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: {
        data: {
          id: "user-cookie-1",
          roles: ["titulado"],
          idleTimeoutSeconds: 900,
          warningSeconds: 180,
          absoluteExpiresAt: "2026-11-25T10:00:00.000Z",
        },
      },
    } as never);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    try {
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SessionGate>
              <p>contenido privado</p>
            </SessionGate>
          </AuthProvider>
        </QueryClientProvider>,
      );

      await waitFor(() =>
        expect(screen.getByText("contenido privado")).toBeInTheDocument(),
      );
      expect(replace).not.toHaveBeenCalled();
    } finally {
      getSpy.mockRestore();
      queryClient.clear();
    }
  });
});
