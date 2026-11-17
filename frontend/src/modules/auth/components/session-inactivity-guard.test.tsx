import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SessionInactivityGuard } from "./session-inactivity-guard";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();
const mockLogout = vi.fn();
const mockEndSession = vi.fn();
let mockBroadcastHandler: ((msg: { type: string; reason?: string }) => void) | null = null;
const mockBroadcastAuthEvent = vi.fn();

vi.mock("../utils/auth-broadcast", () => ({
  broadcastAuthEvent: (msg: { type: string; reason?: string }) => mockBroadcastAuthEvent(msg),
  useAuthBroadcastSync: (callback: (msg: { type: string; reason?: string }) => void) => {
    mockBroadcastHandler = callback;
  },
}));

vi.mock("../services/auth.service", () => ({
  authService: {
    getSession: () => mockGetSession(),
    refreshSession: () => mockRefreshSession(),
    logout: () => mockLogout(),
  },
}));

vi.mock("../utils/session", () => ({
  endSession: () => mockEndSession(),
}));

let mockUseSessionInactivityResult = {
  isWarningOpen: false,
  secondsLeft: 180,
  isRefreshing: false,
  stayConnected: vi.fn(),
  resetActivity: vi.fn(),
  recordActivity: vi.fn(),
};

vi.mock("../hooks/use-session-inactivity", () => ({
  useSessionInactivity: (options: { onTimeout: () => void }) => {
    (
      mockUseSessionInactivityResult as typeof mockUseSessionInactivityResult & {
        triggerTimeout: () => void;
      }
    ).triggerTimeout = options.onTimeout;
    return mockUseSessionInactivityResult;
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: {
      idleTimeoutSeconds: 900,
      warningSeconds: 180,
    },
  }),
}));

describe("SessionInactivityGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSessionInactivityResult = {
      isWarningOpen: false,
      secondsLeft: 180,
      isRefreshing: false,
      stayConnected: vi.fn(),
      resetActivity: vi.fn(),
      recordActivity: vi.fn(),
    };
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

    expect(mockUseSessionInactivityResult.stayConnected).toHaveBeenCalledTimes(
      1,
    );
  });

  it("closes session and redirects to /login on Cerrar sesión click", async () => {
    mockUseSessionInactivityResult.isWarningOpen = true;
    const user = userEvent.setup();

    render(<SessionInactivityGuard />);
    await user.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    expect(mockEndSession).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledTimes(1);
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
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockBroadcastAuthEvent).toHaveBeenCalledWith({
      type: "SESSION_CLOSED",
      reason: "SESSION_EXPIRED",
    });
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("reason=SESSION_EXPIRED"),
    );
  });

  it("cierra la sesión y redirige a /session-closed al recibir evento de otra pestaña (CA10)", () => {
    render(<SessionInactivityGuard />);

    mockBroadcastHandler?.({
      type: "SESSION_CLOSED",
      reason: "SESSION_REVOKED",
    });

    expect(mockEndSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/session-closed?reason=SESSION_REVOKED");
  });
});
