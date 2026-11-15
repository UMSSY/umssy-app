import "@/shared/testing/indexed-db.mock";
import { cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { renderHookWithQuery } from "@/shared/testing/render-hook-with-query";
import { registrationsService } from "../services/registrations.service";
import { useMyPassesHistory } from "./use-my-passes";

afterEach(() => {
  cleanup();
  clearAccessToken();
  vi.restoreAllMocks();
});

describe("useMyPassesHistory", () => {
  it("waits for activation before loading the first history page", async () => {
    await saveAccessToken("signed-token");
    const getFinished = vi.spyOn(registrationsService, "getFinished").mockResolvedValue({
      items: [], total: 1, totalPages: 1, limit: 10,
    });
    const { result, rerender } = renderHookWithQuery(
      ({ enabled }: { enabled: boolean }) => useMyPassesHistory(enabled),
      { initialProps: { enabled: false } },
    );

    expect(getFinished).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.total).toBe(1));
    expect(getFinished).toHaveBeenCalledWith(1, 10, expect.any(AbortSignal), "signed-token");
  });
  it("revalidates on activation without showing the previous page", async () => {
    await saveAccessToken("signed-token");
    let resolveSecond!: (value: Awaited<ReturnType<typeof registrationsService.getFinished>>) => void;
    const getFinished = vi.spyOn(registrationsService, "getFinished")
      .mockResolvedValueOnce({ items: [{ id: "old", title: "Old workshop", date: "2026-08-10", startTime: "09:00", endTime: "12:00", location: null }], total: 1, totalPages: 1, limit: 10 })
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
    const { result, rerender } = renderHookWithQuery(
      ({ enabled }: { enabled: boolean }) => useMyPassesHistory(enabled),
      { initialProps: { enabled: true } },
    );

    await waitFor(() => expect(result.current.registrations[0]?.id).toBe("old"));
    rerender({ enabled: false });
    rerender({ enabled: true });
    await waitFor(() => expect(getFinished).toHaveBeenCalledTimes(2));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.registrations).toEqual([]);
    expect(result.current.total).toBe(0);
    resolveSecond({ items: [{ id: "new", title: "New workshop", date: "2026-09-10", startTime: "09:00", endTime: "12:00", location: null }], total: 1, totalPages: 1, limit: 10 });
    await waitFor(() => expect(result.current.registrations[0]?.id).toBe("new"));
  });
});
