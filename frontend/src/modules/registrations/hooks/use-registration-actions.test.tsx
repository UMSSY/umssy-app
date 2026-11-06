import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHookWithQuery } from "@/shared/testing/render-hook-with-query";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { registrationsService } from "../services/registrations.service";
import { useRegistrationActions } from "./use-registration-actions";
import { REGISTRATION_QUERY_KEYS } from "../constants/registration-query-keys.constants";
import type { RegistrationResponse } from "../types/registration-response.types";

vi.mock("../services/registrations.service", () => ({
  registrationsService: { create: vi.fn(), cancel: vi.fn() },
}));
const registration: RegistrationResponse = {
  id: "r1",
  eventId: "e1",
  status: "confirmed",
  qrToken: "qr",
  registeredAt: "2026-10-23T12:00:00Z",
  cancelledAt: null,
};

beforeEach(() => {
  saveAccessToken("token-a");
});
afterEach(() => {
  cleanup();
  clearAccessToken();
  vi.resetAllMocks();
});

describe("useRegistrationActions", () => {
  it("updates the own record and invalidates list, detail and passes after creation", async () => {
    vi.mocked(registrationsService.create).mockResolvedValue(registration);
    const { result, client } = renderHookWithQuery(() => useRegistrationActions("e1"));
    const invalidate = vi.spyOn(client, "invalidateQueries");
    act(() => {
      result.current.register();
    });
    await waitFor(() =>
      expect(client.getQueryData(REGISTRATION_QUERY_KEYS.own("e1", "token-a"))).toEqual(registration),
    );
    expect(registrationsService.create).toHaveBeenCalledWith("e1", "token-a");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["events", "list"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["events", "my-passes"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["events", "detail", "e1"] });
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("updates the cached status after cancellation", async () => {
    const cancelled: RegistrationResponse = {
      ...registration,
      status: "cancelled",
      cancelledAt: registration.registeredAt,
    };
    vi.mocked(registrationsService.cancel).mockResolvedValue(cancelled);
    const { result, client } = renderHookWithQuery(() => useRegistrationActions("e1"));
    act(() => {
      result.current.cancel("r1");
    });
    await waitFor(() =>
      expect(client.getQueryData(REGISTRATION_QUERY_KEYS.own("e1", "token-a"))).toEqual(cancelled),
    );
    expect(registrationsService.cancel).toHaveBeenCalledWith("r1", "token-a");
  });

  it("displays a domain error and does not retry or optimistically consume capacity", async () => {
    vi.mocked(registrationsService.create).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          statusCode: 409,
          ok: false,
          code: "EVENT_FULL",
          detail: "Private detail",
          data: null,
        },
      },
    });
    const { result, client } = renderHookWithQuery(() => useRegistrationActions("e1"));
    act(() => {
      result.current.register();
    });
    await waitFor(() => expect(result.current.error).toBe("Ya no quedan cupos disponibles."));
    expect(registrationsService.create).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(REGISTRATION_QUERY_KEYS.own("e1", "token-a"))).toBeUndefined();
  });

  it("clears a previous action error when the next action starts", async () => {
    vi.mocked(registrationsService.cancel).mockRejectedValue(new Error("Offline"));
    vi.mocked(registrationsService.create).mockResolvedValue(registration);
    const { result } = renderHookWithQuery(() => useRegistrationActions("e1"));
    act(() => {
      result.current.cancel("r1");
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => {
      result.current.register();
    });
    await waitFor(() => expect(result.current.error).toBeNull());
  });

  it("ignores a mutation response from a session that has ended", async () => {
    let resolve!: (value: RegistrationResponse) => void;
    vi.mocked(registrationsService.create).mockImplementation(
      () => new Promise((done) => { resolve = done; }),
    );
    const { result, client } = renderHookWithQuery(() => useRegistrationActions("e1"));
    const invalidate = vi.spyOn(client, "invalidateQueries");
    act(() => {
      result.current.register();
    });
    await waitFor(() => expect(registrationsService.create).toHaveBeenCalled());
    act(() => {
      saveAccessToken("token-b");
    });
    await act(async () => {
      resolve(registration);
    });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(client.getQueryData(REGISTRATION_QUERY_KEYS.own("e1", "token-b"))).toBeUndefined();
    expect(client.getQueryData(REGISTRATION_QUERY_KEYS.own("e1", "token-a"))).toBeUndefined();
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("cancels an older lookup before writing the successful mutation result", async () => {
    vi.mocked(registrationsService.create).mockResolvedValue(registration);
    const { result, client } = renderHookWithQuery(() => useRegistrationActions("e1"));
    const key = REGISTRATION_QUERY_KEYS.own("e1", "token-a");
    let resolveOld!: (value: null) => void;
    const pending = client
      .fetchQuery({
        queryKey: key,
        queryFn: () => new Promise((resolve) => { resolveOld = resolve; }),
      })
      .catch(() => null);
    act(() => {
      result.current.register();
    });
    await waitFor(() => expect(client.getQueryData(key)).toEqual(registration));
    resolveOld(null);
    await pending;
    expect(client.getQueryData(key)).toEqual(registration);
  });

  it("submits only once when register is called twice before rendering", async () => {
    let resolve!: (value: RegistrationResponse) => void;
    vi.mocked(registrationsService.create).mockImplementation(() => new Promise((done) => { resolve = done; }));
    const { result } = renderHookWithQuery(() => useRegistrationActions("e1"));
    act(() => {
      result.current.register();
      result.current.register();
    });
    await waitFor(() => expect(registrationsService.create).toHaveBeenCalledTimes(1));
    await act(async () => { resolve(registration); });
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("refreshes stale event and registration data after an already registered response", async () => {
    vi.mocked(registrationsService.create).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { statusCode: 409, ok: false, code: "ALREADY_REGISTERED", detail: "Private detail", data: null } },
    });
    const { result, client } = renderHookWithQuery(() => useRegistrationActions("e1"));
    const invalidate = vi.spyOn(client, "invalidateQueries");
    act(() => { result.current.register(); });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.errorCode).toBe("ALREADY_REGISTERED");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: REGISTRATION_QUERY_KEYS.own("e1", "token-a"), exact: true });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: REGISTRATION_QUERY_KEYS.detail("e1") });
  });

  it("does not update cached data after unmounting during a request", async () => {
    let resolve!: (value: RegistrationResponse) => void;
    vi.mocked(registrationsService.create).mockImplementation(() => new Promise((done) => { resolve = done; }));
    const { result, client, unmount } = renderHookWithQuery(() => useRegistrationActions("e1"));
    act(() => { result.current.register(); });
    await waitFor(() => expect(registrationsService.create).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => { resolve(registration); });
    expect(client.getQueryData(REGISTRATION_QUERY_KEYS.own("e1", "token-a"))).toBeUndefined();
  });
});
