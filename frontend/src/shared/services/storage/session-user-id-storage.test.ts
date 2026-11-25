import "@/shared/testing/indexed-db.mock";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readIndexedDb, writeIndexedDb } from "./browser-indexed-db";
import {
  getCurrentSessionUserId,
  setCurrentSessionUserId,
  clearCurrentSessionUserId,
  waitForSessionUserIdWrites,
} from "./session-user-id-storage";

describe("session-user-id-storage", () => {
  beforeEach(async () => {
    clearCurrentSessionUserId();
    await waitForSessionUserIdWrites();
    sessionStorage.clear();
  });

  it("almacena el userId en memoria y en IndexedDB sin usar sessionStorage", async () => {
    expect(getCurrentSessionUserId()).toBeNull();

    setCurrentSessionUserId("user-123");
    await waitForSessionUserIdWrites();

    expect(getCurrentSessionUserId()).toBe("user-123");
    expect(await readIndexedDb("umssy:session:current-user-id")).toBe("user-123");
    expect(Object.values(sessionStorage)).not.toContain("user-123");
  });

  it("recupera el userId desde IndexedDB tras recargar la memoria", async () => {
    await writeIndexedDb("umssy:session:current-user-id", "persisted-user-456");
    vi.resetModules();
    const reloaded = await import("./session-user-id-storage");

    expect(reloaded.getCurrentSessionUserId()).toBeNull();
    expect(await reloaded.readCurrentSessionUserId()).toBe("persisted-user-456");
    expect(reloaded.getCurrentSessionUserId()).toBe("persisted-user-456");
  });

  it("elimina el userId en memoria e IndexedDB al llamar clearCurrentSessionUserId", async () => {
    setCurrentSessionUserId("temp-user");
    await waitForSessionUserIdWrites();
    expect(getCurrentSessionUserId()).toBe("temp-user");

    clearCurrentSessionUserId();
    await waitForSessionUserIdWrites();

    expect(getCurrentSessionUserId()).toBeNull();
    expect(await readIndexedDb("umssy:session:current-user-id")).toBeNull();
  });
});
