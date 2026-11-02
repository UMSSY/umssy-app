import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEvent } from "./use-event";
import { clearAccessToken, saveAccessToken } from '@/shared/services/storage/access-token-storage';
import { eventsService } from "../services/events.service";
import type { EventDetail } from "../types/event-detail.types";
vi.mock("../services/events.service", () => ({
  eventsService: { getEvent: vi.fn() },
}));
afterEach(() => {
  cleanup();
  clearAccessToken();
  vi.resetAllMocks();
});
const event = { id: "a", title: "Taller A" } as EventDetail;

describe("useEvent", () => {
  it("does not request a detail until a workshop is selected", () => {
    const { result } = renderHook(() => useEvent(null));
    expect(result.current.isLoading).toBe(false);
    expect(eventsService.getEvent).not.toHaveBeenCalled();
  });
  it("loads the selected detail", async () => {
    vi.mocked(eventsService.getEvent).mockResolvedValue(event);
    const { result } = renderHook(() => useEvent("a"));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.event).toEqual(event));
    expect(result.current.isLoading).toBe(false);
  });
  it("ignores an older response after selecting a different workshop", async () => {
    let resolveOld!: (value: EventDetail) => void;
    vi.mocked(eventsService.getEvent)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValueOnce({ ...event, id: "b", title: "Taller B" });
    const { result, rerender } = renderHook(({ id }) => useEvent(id), {
      initialProps: { id: "a" },
    });
    const oldSignal = vi.mocked(eventsService.getEvent).mock.calls[0][1];
    rerender({ id: "b" });
    expect(oldSignal?.aborted).toBe(true);
    expect(result.current.event).toBeNull();
    await waitFor(() => expect(result.current.event?.id).toBe("b"));
    await act(async () => resolveOld(event));
    expect(result.current.event?.id).toBe("b");
  });
  it("hides previous content while requesting another workshop", async () => {
    vi.mocked(eventsService.getEvent)
      .mockResolvedValueOnce(event)
      .mockImplementationOnce(() => new Promise(() => {}));
    const { result, rerender } = renderHook(({ id }) => useEvent(id), {
      initialProps: { id: "a" },
    });
    await waitFor(() => expect(result.current.event).toEqual(event));
    rerender({ id: "b" });
    expect(result.current.event).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });
  it("can retry network errors", async () => {
    vi.mocked(eventsService.getEvent)
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce(event);
    const { result } = renderHook(() => useEvent("a"));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.event).toEqual(event));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
  it("recognizes a 404 response", async () => {
    vi.mocked(eventsService.getEvent).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    });
    const { result } = renderHook(() => useEvent("missing"));
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.event).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('loads a fresh personalized detail when the session changes', async () => {
    vi.mocked(eventsService.getEvent).mockImplementation(async (
      id,
      _signal,
      token,
    ) => ({ ...event, id, hasSupported: token === 'token-a' }));

    const { result } = renderHook(() => useEvent('a'));
    await waitFor(() => expect(result.current.event?.hasSupported).toBe(false));

    act(() => saveAccessToken('token-a'));
    await waitFor(() => expect(result.current.event?.hasSupported).toBe(true));

    act(() => saveAccessToken('token-b'));
    await waitFor(() => expect(result.current.event?.hasSupported).toBe(false));

    act(() => clearAccessToken());
    await waitFor(() => expect(result.current.event?.hasSupported).toBe(false));

    expect(eventsService.getEvent).toHaveBeenCalledWith('a', expect.any(AbortSignal), 'token-a');
    expect(eventsService.getEvent).toHaveBeenCalledWith('a', expect.any(AbortSignal), 'token-b');
  });
});
