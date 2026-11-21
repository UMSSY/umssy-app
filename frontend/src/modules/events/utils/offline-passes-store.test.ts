import "@/shared/testing/indexed-db.mock";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readIndexedDb, writeIndexedDb } from "@/shared/services/storage/browser-indexed-db";
import { offlinePassesStore } from "./offline-passes-store";

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
});
