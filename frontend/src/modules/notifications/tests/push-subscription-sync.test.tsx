import { act, cleanup, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PushSubscriptionSync } from "../components/push-subscription-sync";

const session = vi.hoisted(() => ({
  token: null as string | null,
  listeners: new Set<() => void>(),
  setToken(token: string | null) {
    session.token = token;
    session.listeners.forEach((listener) => listener());
  },
}));

const pushMock = vi.hoisted(() => ({
  environment: "supported" as const,
  sync: vi.fn(),
}));

const preferencesMock = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/shared/services/storage/access-token-storage", () => ({
  getAccessToken: () => session.token,
  subscribeAccessToken: (listener: () => void) => {
    session.listeners.add(listener);
    return () => session.listeners.delete(listener);
  },
}));

vi.mock("@/shared/hooks/use-push-notifications", () => ({
  usePushNotifications: () => pushMock,
}));

vi.mock("../services/notification-preferences.service", () => ({
  notificationPreferencesService: preferencesMock,
}));

function renderSync() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PushSubscriptionSync />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  session.token = null;
  session.listeners.clear();
  pushMock.sync.mockReset();
  preferencesMock.get.mockReset();
  preferencesMock.get.mockResolvedValue({ pushEnabled: true, emailEnabled: false, inAppEnabled: true });
});

afterEach(() => {
  cleanup();
});

describe("PushSubscriptionSync", () => {
  it("registra la suscripción con la sesión que la inició", async () => {
    pushMock.sync.mockResolvedValue(true);
    session.token = "session-a";

    renderSync();

    await waitFor(() => expect(pushMock.sync).toHaveBeenCalledOnce());
    expect(pushMock.sync).toHaveBeenCalledWith(
      expect.objectContaining({ token: "session-a" }),
    );
  });

  it("cancela el registro pendiente cuando cambia la sesión", async () => {
    pushMock.sync.mockReturnValue(new Promise<boolean>(() => undefined));
    session.token = "session-a";

    renderSync();

    await waitFor(() => expect(pushMock.sync).toHaveBeenCalledOnce());
    const { signal } = pushMock.sync.mock.calls[0][0] as { signal: AbortSignal };

    act(() => session.setToken(null));

    expect(signal.aborted).toBe(true);
  });

  it("no registra el dispositivo si la cuenta no eligió Push", async () => {
    preferencesMock.get.mockResolvedValue({ pushEnabled: false, emailEnabled: true, inAppEnabled: true });
    session.token = "session-a";

    renderSync();

    await waitFor(() => expect(preferencesMock.get).toHaveBeenCalled());
    await act(async () => {});
    expect(pushMock.sync).not.toHaveBeenCalled();
  });
});
