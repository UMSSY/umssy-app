import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { SessionInactivityGuard } from "./session-inactivity-guard";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockEndSession = vi.fn();
let mockBroadcastHandler: ((msg: { type: string; reason?: string }) => void) | null = null;
const mockBroadcastAuthEvent = vi.fn();

vi.mock("../utils/auth-broadcast", () => ({
  broadcastAuthEvent: (msg: { type: string; reason?: string }) => mockBroadcastAuthEvent(msg),
  useAuthBroadcastSync: (callback: (msg: { type: string; reason?: string }) => void) => {
    mockBroadcastHandler = callback;
  },
}));

vi.mock("@/shared/services/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../utils/session", () => ({
  endSession: () => mockEndSession(),
}));

const mockUseOptionalAuth = vi.fn();
vi.mock("@/shared/contexts/auth-context", () => ({
  useOptionalAuth: () => mockUseOptionalAuth(),
}));

let mockUseSessionInactivityResult = {
  isWarningOpen: false,
  secondsLeft: 180,
  isRefreshing: false,
  stayConnected: vi.fn(),
  resetActivity: vi.fn(),
  recordActivity: vi.fn(),
};
let capturedInactivityOptions: Record<string, unknown> | null = null;

vi.mock("../hooks/use-session-inactivity", () => ({
  useSessionInactivity: (options: Record<string, unknown> & { onTimeout: () => void }) => {
    capturedInactivityOptions = options;
    (
      mockUseSessionInactivityResult as typeof mockUseSessionInactivityResult & {
        triggerTimeout: () => void;
      }
    ).triggerTimeout = options.onTimeout;
    return mockUseSessionInactivityResult;
  },
}));

describe("SessionInactivityGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.post).mockResolvedValue({ status: 204 });
    capturedInactivityOptions = null;
    mockUseOptionalAuth.mockReturnValue({
      idleTimeoutSeconds: 900,
      warningSeconds: 180,
      absoluteExpiresAt: "2026-11-24T23:59:59.000Z",
    });
    mockUseSessionInactivityResult = {
      isWarningOpen: false,
      secondsLeft: 180,
      isRefreshing: false,
      stayConnected: vi.fn(),
      resetActivity: vi.fn(),
      recordActivity: vi.fn(),
    };
  });

  it("reuses session timings from AuthContext without polling getSession", () => {
    render(<SessionInactivityGuard />);

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(capturedInactivityOptions?.idleTimeoutSeconds).toBe(900);
    expect(capturedInactivityOptions?.warningSeconds).toBe(180);
    expect(capturedInactivityOptions?.absoluteExpiresAt).toBe("2026-11-24T23:59:59.000Z");
  });

  it("prefers explicit timing props over context defaults", () => {
    render(
      <SessionInactivityGuard
        idleTimeoutSeconds={600}
        warningSeconds={120}
        absoluteExpiresAt="2026-11-25T01:00:00.000Z"
      />,
    );

    expect(capturedInactivityOptions?.idleTimeoutSeconds).toBe(600);
    expect(capturedInactivityOptions?.warningSeconds).toBe(120);
    expect(capturedInactivityOptions?.absoluteExpiresAt).toBe("2026-11-25T01:00:00.000Z");
  });

  it("does not render modal when warning is not open", () => {
    render(<SessionInactivityGuard />);
    expect(
      screen.queryByRole("heading", { name: /tu sesión está por expirar/i }),
    ).not.toBeInTheDocument();
  });

  it("renders SessionTimeoutModal when isWarningOpen is true", () => {
    mockUseSessionInactivityResult.isWarningOpen = true;
    mockUseSessionInactivityResult.secondsLeft = 180;

    render(<SessionInactivityGuard />);
    expect(
      screen.getByRole("heading", { name: /tu sesión está por expirar/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("03:00")).toBeInTheDocument();
  });

  it("triggers stayConnected when clicking Seguir conectado", async () => {
    mockUseSessionInactivityResult.isWarningOpen = true;
    const user = userEvent.setup();

    render(<SessionInactivityGuard />);
    await user.click(screen.getByRole("button", { name: /seguir conectado/i }));

    expect(mockUseSessionInactivityResult.stayConnected).toHaveBeenCalledTimes(1);
  });

  it("closes session and redirects to /login on Cerrar sesión click", async () => {
    mockUseSessionInactivityResult.isWarningOpen = true;
    const user = userEvent.setup();

    render(<SessionInactivityGuard />);
    await user.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    expect(mockEndSession).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
      "/auth/logout",
      undefined,
      { timeout: expect.any(Number) },
    );
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("reason=SESSION_EXPIRED"),
    );
  });

  it("closes session and redirects with reason=SESSION_EXPIRED on timeout", () => {
    render(<SessionInactivityGuard />);

    (
      mockUseSessionInactivityResult as typeof mockUseSessionInactivityResult & {
        triggerTimeout: () => void;
      }
    ).triggerTimeout();

    expect(mockEndSession).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
      "/auth/logout",
      undefined,
      { timeout: expect.any(Number) },
    );
    expect(mockBroadcastAuthEvent).toHaveBeenCalledWith({
      type: "SESSION_CLOSED",
      reason: "SESSION_EXPIRED",
    });
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("reason=SESSION_EXPIRED"),
    );
  });

  it("cierra la sesión y redirige a /session-closed al recibir evento de otra pestaña", () => {
    render(<SessionInactivityGuard />);

    mockBroadcastHandler?.({
      type: "SESSION_CLOSED",
      reason: "SESSION_REVOKED",
    });

    expect(mockEndSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/session-closed?reason=SESSION_REVOKED");
  });
});
