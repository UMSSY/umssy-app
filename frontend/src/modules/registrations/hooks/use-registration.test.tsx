import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHookWithQuery } from "@/shared/testing/render-hook-with-query";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { registrationsService } from "../services/registrations.service";
import { useRegistration } from "./use-registration";
import type { RegistrationResponse } from "../types/registration-response.types";

vi.mock("../services/registrations.service", () => ({ registrationsService: { getOwn: vi.fn() } }));
const registration: RegistrationResponse = {
  id: "r1",
  eventId: "e1",
  status: "confirmed",
  qrToken: "qr",
  registeredAt: "2026-10-23T12:00:00Z",
  cancelledAt: null,
};

afterEach(() => {
  cleanup();
  clearAccessToken();
  vi.resetAllMocks();
});

describe("useRegistration", () => {
  it("does not request private data without a session or event", async () => {
    const { result, rerender } = renderHookWithQuery(
      ({ eventId }: { eventId: string | null }) => useRegistration(eventId),
      { initialProps: { eventId: "e1" as string | null } },
    );
    expect(result.current.isLoading).toBe(false);
    expect(registrationsService.getOwn).not.toHaveBeenCalled();
    rerender({ eventId: null });
    act(() => {
      saveAccessToken("token-a");
    });
    expect(registrationsService.getOwn).not.toHaveBeenCalled();
  });

  it("loads a typed own registration with the captured token", async () => {
    saveAccessToken("token-a");
    vi.mocked(registrationsService.getOwn).mockResolvedValue(registration);
    const { result } = renderHookWithQuery(() => useRegistration("e1"));
    await waitFor(() => expect(result.current.registration).toEqual(registration));
    expect(registrationsService.getOwn).toHaveBeenCalledWith("e1", expect.any(AbortSignal), "token-a");
    expect(result.current.error).toBeNull();
  });

  it("exposes absence without treating it as a failed request", async () => {
    saveAccessToken("token-a");
    vi.mocked(registrationsService.getOwn).mockResolvedValue(null);
    const { result } = renderHookWithQuery(() => useRegistration("e1"));
    await waitFor(() => expect(registrationsService.getOwn).toHaveBeenCalled());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.registration).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("translates errors without automatic retries", async () => {
    saveAccessToken("token-a");
    vi.mocked(registrationsService.getOwn).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          statusCode: 404,
          ok: false,
          code: "EVENT_NOT_FOUND",
          detail: "Internal detail",
          data: null,
        },
      },
    });
    const { result } = renderHookWithQuery(() => useRegistration("e1"));
    await waitFor(() => expect(result.current.error).toBe("No encontramos el evento solicitado."));
    expect(registrationsService.getOwn).toHaveBeenCalledTimes(1);
  });

  it("does not expose another session's cached or late response", async () => {
    saveAccessToken("token-a");
    let resolveOld!: (value: RegistrationResponse) => void;
    vi.mocked(registrationsService.getOwn)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce(null);
    const { result } = renderHookWithQuery(() => useRegistration("e1"));
    await waitFor(() => expect(registrationsService.getOwn).toHaveBeenCalledTimes(1));
    act(() => {
      saveAccessToken("token-b");
    });
    await waitFor(() => expect(registrationsService.getOwn).toHaveBeenCalledTimes(2));
    await act(async () => {
      resolveOld(registration);
    });
    expect(result.current.registration).toBeNull();
  });
});
