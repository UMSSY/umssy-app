import "@/shared/testing/indexed-db.mock";
import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { readIndexedDb } from "@/shared/services/storage/browser-indexed-db";
import { renderHookWithQuery } from "@/shared/testing/render-hook-with-query";
import { offlinePassesStore } from "../utils/offline-passes-store";
import { useOfflinePassesSnapshot } from "./use-offline-passes-snapshot";

const pass = {
  id: "reg-1",
  eventName: "React",
  date: "2026-11-20",
  startTime: "09:00",
  endTime: "12:00",
  location: "Aula 101",
  status: "Confirmada",
  qrToken: "b".repeat(64),
};

describe("useOfflinePassesSnapshot", () => {
  it("loads the saved copy of the current user", async () => {
    await offlinePassesStore.save("user-a", [pass]);
    const { result } = renderHookWithQuery(() => useOfflinePassesSnapshot("user-a", false));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.snapshot?.passes).toEqual([pass]);
  });

  it("returns no copy when the user has none", async () => {
    await offlinePassesStore.save("user-a", [pass]);
    const { result } = renderHookWithQuery(() => useOfflinePassesSnapshot("user-b", false));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.snapshot).toBeNull();
  });

  it("does not read storage without a user", () => {
    vi.mocked(readIndexedDb).mockClear();
    const { result } = renderHookWithQuery(() => useOfflinePassesSnapshot(null, false));
    expect(result.current).toEqual({ snapshot: null, isLoading: false });
    expect(readIndexedDb).not.toHaveBeenCalledWith(expect.stringMatching(/^offline-passes:/));
  });

  it("reloads the copy when connectivity changes without flashing a loading state", async () => {
    await offlinePassesStore.save("user-a", [pass]);
    const { result, rerender } = renderHookWithQuery(
      ({ isOnline }: { isOnline: boolean }) => useOfflinePassesSnapshot("user-a", isOnline),
      { initialProps: { isOnline: true } },
    );
    await waitFor(() => expect(result.current.snapshot?.passes).toHaveLength(1));
    await offlinePassesStore.save("user-a", [pass, { ...pass, id: "reg-2" }]);
    const load = vi.spyOn(offlinePassesStore, "load");
    rerender({ isOnline: false });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.snapshot?.passes).toHaveLength(1);
    await waitFor(() => expect(result.current.snapshot?.passes).toHaveLength(2));
    expect(load).toHaveBeenCalledWith("user-a");
  });

  it("never shows the previous user's copy while another user loads", async () => {
    await offlinePassesStore.save("user-a", [pass]);
    const { result, rerender } = renderHookWithQuery(
      ({ userId }: { userId: string }) => useOfflinePassesSnapshot(userId, false),
      { initialProps: { userId: "user-a" } },
    );
    await waitFor(() => expect(result.current.snapshot?.userId).toBe("user-a"));
    rerender({ userId: "user-b" });
    expect(result.current.snapshot).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });
});
