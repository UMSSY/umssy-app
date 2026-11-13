import "@/shared/testing/indexed-db.mock";
import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { renderHookWithQuery } from "@/shared/testing/render-hook-with-query";
import { offlinePassesStore } from "../utils/offline-passes-store";
import { useMyPasses } from "./use-my-passes";
import { useOnlineStatus } from "./use-online-status";
import { usePassesViewState } from "./use-passes-view-state";

vi.mock("./use-my-passes", () => ({ useMyPasses: vi.fn() }));
vi.mock("./use-online-status", () => ({ useOnlineStatus: vi.fn() }));

type LiveState = ReturnType<typeof useMyPasses>;

const retry = vi.fn();
const live: LiveState = { registrations: [], isLoading: false, error: null, isConnectionError: false, retry };
const registration = { id: "reg-1", eventName: "React", date: "2026-11-20", startTime: "09:00", endTime: "12:00", location: "Aula 101", status: "Confirmada" };
const saved = { ...registration, location: null, qrToken: "c".repeat(64) };
const token = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;

function setup({ online = true, liveState = {} }: { online?: boolean; liveState?: Partial<LiveState> } = {}) {
  vi.mocked(useOnlineStatus).mockReturnValue(online);
  vi.mocked(useMyPasses).mockReturnValue({ ...live, ...liveState });
  return renderHookWithQuery(() => usePassesViewState());
}

beforeEach(async () => {
  vi.useRealTimers();
  await saveAccessToken(token("user-a"));
});

describe("usePassesViewState", () => {
  it("shows live passes online and marks the ones saved on this device", async () => {
    await offlinePassesStore.save("user-a", [saved]);
    const { result } = setup({ liveState: { registrations: [registration, { ...registration, id: "reg-2" }] } });
    expect(result.current.status).toBe("live");
    await waitFor(() => expect(result.current.offlineQrTokens).toEqual({ "reg-1": "c".repeat(64) }));
    expect(result.current.passes.map(({ id }) => id)).toEqual(["reg-1", "reg-2"]);
    expect(result.current.isStale).toBe(false);
  });

  it("reports loading while the live query runs online", () => {
    const { result } = setup({ liveState: { isLoading: true } });
    expect(result.current.status).toBe("loading");
  });

  it("shows the saved copy offline without exposing the QR token in the list", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-13T12:00:00Z"), toFake: ["Date"] });
    await offlinePassesStore.save("user-a", [saved]);
    const { result } = setup({ online: false });
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("saved"));
    expect(result.current.passes).toEqual([{ ...registration, location: "" }]);
    expect(result.current.offlineQrTokens["reg-1"]).toBe("c".repeat(64));
    expect(result.current.lastUpdated).toMatch(/2026/);
    expect(result.current.isStale).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("marks an offline copy older than 24 hours as stale", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-10T12:00:00Z"), toFake: ["Date"] });
    await offlinePassesStore.save("user-a", [saved]);
    vi.setSystemTime(new Date("2026-11-13T12:00:00Z"));
    const { result } = setup({ online: false });
    await waitFor(() => expect(result.current.status).toBe("saved"));
    expect(result.current.isStale).toBe(true);
  });

  it("refreshes the staleness clock every minute", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-13T11:59:30Z") });
    await offlinePassesStore.save("user-a", [saved]);
    vi.setSystemTime(new Date("2026-11-14T11:59:30Z"));
    const { result } = setup({ online: false });
    await vi.waitFor(() => expect(result.current.status).toBe("saved"));
    expect(result.current.isStale).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(result.current.isStale).toBe(true);
  });

  it("never falls into the empty registrations state offline without a copy", async () => {
    await offlinePassesStore.save("user-b", [saved]);
    const { result } = setup({ online: false });
    await waitFor(() => expect(result.current.status).toBe("no-offline-copy"));
    expect(result.current.passes).toEqual([]);
  });

  it("treats an empty saved copy as no copy offline", async () => {
    await offlinePassesStore.save("user-a", []);
    const { result } = setup({ online: false });
    await waitFor(() => expect(result.current.status).toBe("no-offline-copy"));
  });

  it("falls back to the saved copy as stale when the online query fails", async () => {
    await offlinePassesStore.save("user-a", [saved]);
    const { result } = setup({ liveState: { error: "Sin servidor" } });
    await waitFor(() => expect(result.current.status).toBe("saved"));
    expect(result.current.isStale).toBe(true);
    expect(result.current.error).toBe("Sin servidor");
    result.current.retry();
    expect(retry).toHaveBeenCalled();
  });

  it("shows the online error when there is no saved copy", async () => {
    const { result } = setup({ liveState: { error: "Sin servidor" } });
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("Sin servidor");
  });

  it("flags connection errors without a saved copy", async () => {
    const { result } = setup({ liveState: { error: "No pudimos completar la operación", isConnectionError: true } });
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.isConnectionError).toBe(true);
  });

  it("does not flag connection errors when a saved copy is shown", async () => {
    await offlinePassesStore.save("user-a", [saved]);
    const { result } = setup({ liveState: { error: "Sin servidor", isConnectionError: true } });
    await waitFor(() => expect(result.current.status).toBe("saved"));
    expect(result.current.isConnectionError).toBe(false);
  });
});
