import "@/shared/testing/indexed-db.mock";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readIndexedDb, writeIndexedDb } from "@/shared/services/storage/browser-indexed-db";
import { saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { endOfflinePassesSession } from "@/shared/services/storage/offline-passes-owner";
import { loadSessionOfflinePasses, offlinePassesStore } from "./offline-passes-store";
import type { OfflinePass } from "../types/offline-pass.types";

const pass = {
  id: "reg-1",
  eventName: "React",
  date: "2026-11-20",
  startTime: "09:00",
  endTime: "12:00",
  location: "Aula 101",
  status: "Confirmada",
  qrToken: "a".repeat(64),
};

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("offlinePassesStore", () => {
  it("saves a snapshot per user and loads it back", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-13T15:00:00Z"), toFake: ["Date"] });
    await offlinePassesStore.save("user-a", [pass, { ...pass, id: "reg-2", location: null }]);
    expect(writeIndexedDb).toHaveBeenCalledWith("offline-passes:user-a", expect.any(Object));
    expect(await offlinePassesStore.load("user-a")).toEqual({
      userId: "user-a",
      savedAt: "2026-11-13T15:00:00.000Z",
      passes: [pass, { ...pass, id: "reg-2", location: null }],
    });
  });

  it("never returns another user's passes", async () => {
    await offlinePassesStore.save("user-a", [pass]);
    expect(await offlinePassesStore.load("user-b")).toBeNull();
  });

  it("replaces the whole set so removed passes disappear", async () => {
    await offlinePassesStore.save("user-a", [pass, { ...pass, id: "reg-2" }]);
    await offlinePassesStore.save("user-a", [{ ...pass, id: "reg-2" }]);
    expect((await offlinePassesStore.load("user-a"))?.passes.map(({ id }) => id)).toEqual(["reg-2"]);
  });

  it("keeps an empty snapshot distinct from a missing copy", async () => {
    await offlinePassesStore.save("user-a", []);
    expect(await offlinePassesStore.load("user-a")).toMatchObject({ passes: [] });
    expect(await offlinePassesStore.load("user-c")).toBeNull();
  });

  it("drops passes without a valid QR token or required fields", async () => {
    await offlinePassesStore.save("user-a", [
      pass,
      { ...pass, id: "short", qrToken: "abc" },
      { ...pass, id: "bad-location", location: 3 as unknown as string },
      { ...pass, id: undefined as unknown as string },
    ]);
    expect((await offlinePassesStore.load("user-a"))?.passes.map(({ id }) => id)).toEqual(["reg-1"]);
  });

  it.each([
    ["a non-object value", "broken"],
    ["a snapshot stored under the wrong user", { userId: "user-b", savedAt: "2026-11-13T15:00:00Z", passes: [] }],
    ["an invalid date", { userId: "user-a", savedAt: "ayer", passes: [] }],
    ["a missing pass list", { userId: "user-a", savedAt: "2026-11-13T15:00:00Z" }],
  ])("treats %s as no copy", async (_, stored) => {
    await writeIndexedDb("offline-passes:user-a", stored);
    expect(await offlinePassesStore.load("user-a")).toBeNull();
  });

  it("treats read failures as no copy", async () => {
    vi.mocked(readIndexedDb).mockRejectedValueOnce(new Error("blocked"));
    expect(await offlinePassesStore.load("user-a")).toBeNull();
  });

  it("clears one user or every offline snapshot only", async () => {
    await offlinePassesStore.save("user-a", [pass]);
    await offlinePassesStore.save("user-b", [pass]);
    await writeIndexedDb("other-key", "keep");
    await offlinePassesStore.clearUser("user-a");
    expect(await offlinePassesStore.load("user-a")).toBeNull();
    expect(await offlinePassesStore.load("user-b")).not.toBeNull();
    await offlinePassesStore.clearAll();
    expect(await offlinePassesStore.load("user-b")).toBeNull();
    expect(await readIndexedDb("other-key")).toBe("keep");
  });

  describe("copies saved before the device owner existed", () => {
    const token = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;
    const legacy = { userId: "user-a", savedAt: "2026-11-13T15:00:00.000Z", passes: [pass] };

    it("adopts the copy of the current session and keeps it readable offline", async () => {
      await saveAccessToken(token("user-a"));
      await writeIndexedDb("offline-passes:user-a", legacy);
      expect((await loadSessionOfflinePasses(token("user-a")))?.passes).toEqual([pass]);
      expect(await readIndexedDb("offline-passes:owner")).toBe("user-a");
      expect((await loadSessionOfflinePasses(null))?.passes).toEqual([pass]);
    });

    it("does not adopt another user's copy", async () => {
      await saveAccessToken(token("user-b"));
      await writeIndexedDb("offline-passes:user-a", legacy);
      expect(await loadSessionOfflinePasses(token("user-b"))).toBeNull();
      expect(await readIndexedDb("offline-passes:owner")).toBe(null);
    });

    it("never shows an unowned copy without a session", async () => {
      await writeIndexedDb("offline-passes:user-a", legacy);
      expect(await loadSessionOfflinePasses(null)).toBeNull();
    });

    it("hides the copy without a session once the offline session was revoked", async () => {
      await saveAccessToken(token("user-a"));
      await offlinePassesStore.save("user-a", [pass]);
      expect(await loadSessionOfflinePasses(token("user-a"))).not.toBeNull();
      await endOfflinePassesSession("user-a");
      expect(await loadSessionOfflinePasses(null)).toBeNull();
    });
  });

  it("keeps saved sessions and reads older copies without them", async () => {
    const sessions = [{ id: "s1", startsAt: "2026-12-02T13:00:00.000Z", endsAt: "2026-12-02T16:00:00.000Z", location: null }];
    const withSessions: OfflinePass = { ...pass, id: "reg-2", sessions };
    await offlinePassesStore.save("user-s", [pass, withSessions, { ...pass, id: "reg-3", sessions: [{ id: 1 }] } as unknown as OfflinePass]);
    const passes = (await offlinePassesStore.load("user-s"))?.passes ?? [];
    expect(passes[0]).not.toHaveProperty("sessions");
    expect(passes[1].sessions).toEqual(sessions);
    expect(passes[2]).not.toHaveProperty("sessions");
  });
});
