import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHookWithQuery } from "@/shared/testing/render-hook-with-query";
import { notificationPreferencesService } from "../services/notification-preferences.service";
import { useNotificationPreferences } from "../hooks/use-notification-preferences";

vi.mock("../services/notification-preferences.service", () => ({
  notificationPreferencesService: { get: vi.fn(), update: vi.fn() },
}));

const DEFAULT_PREFERENCES = { pushEnabled: false, emailEnabled: true, inAppEnabled: true };

beforeEach(() => {
  vi.mocked(notificationPreferencesService.get).mockResolvedValue(DEFAULT_PREFERENCES);
  vi.mocked(notificationPreferencesService.update).mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("useNotificationPreferences", () => {
  it("carga la preferencia guardada; en una cuenta nueva es «Solo por correo»", async () => {
    const { result } = renderHookWithQuery(() => useNotificationPreferences());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.savedChannel).toBeNull();
    await waitFor(() => expect(result.current.savedChannel).toBe("email"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.loadError).toBe(false);
  });

  it("expone el error de carga", async () => {
    vi.mocked(notificationPreferencesService.get).mockRejectedValue(new Error("boom"));
    const { result } = renderHookWithQuery(() => useNotificationPreferences());

    await waitFor(() => expect(result.current.loadError).toBe(true));
    expect(result.current.savedChannel).toBeNull();
  });

  it("guarda con PUT y actualiza el canal guardado solo si el servidor confirma", async () => {
    const { result } = renderHookWithQuery(() => useNotificationPreferences());
    await waitFor(() => expect(result.current.savedChannel).toBe("email"));

    await act(() => result.current.saveChannel("in-app"));

    expect(notificationPreferencesService.update).toHaveBeenCalledExactlyOnceWith({
      pushEnabled: false,
      emailEnabled: false,
      inAppEnabled: true,
    });
    await waitFor(() => expect(result.current.savedChannel).toBe("in-app"));
  });

  it("si el PUT falla lanza el error y conserva el canal guardado", async () => {
    vi.mocked(notificationPreferencesService.update).mockRejectedValue(new Error("boom"));
    const { result } = renderHookWithQuery(() => useNotificationPreferences());
    await waitFor(() => expect(result.current.savedChannel).toBe("email"));

    await act(async () => {
      await expect(result.current.saveChannel("push")).rejects.toThrow("boom");
    });

    expect(result.current.savedChannel).toBe("email");
  });
});