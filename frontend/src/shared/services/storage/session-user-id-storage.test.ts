import { describe, it, expect, beforeEach, vi } from "vitest";

const records = vi.hoisted(() => new Map<string, unknown>());
vi.mock("./browser-indexed-db", () => ({
  readIndexedDb: vi.fn(async (key: string) => records.get(key) ?? null),
  writeIndexedDb: vi.fn(async (key: string, value: unknown) => {
    records.set(key, value);
  }),
  removeIndexedDb: vi.fn(async (key: string) => {
    records.delete(key);
  }),
}));

import {
  clearCurrentSessionUserId,
  getCurrentSessionUserId,
  initializeSessionUserId,
  setCurrentSessionUserId,
} from "./session-user-id-storage";

describe("session-user-id-storage", () => {
  beforeEach(() => {
    clearCurrentSessionUserId();
    records.clear();
    vi.resetModules();
  });

  it("almacena el userId en memoria y en la capa compartida de IndexedDB", async () => {
    expect(getCurrentSessionUserId()).toBeNull();

    setCurrentSessionUserId("user-123");

    expect(getCurrentSessionUserId()).toBe("user-123");
    expect(records.get("umssy_current_user_id")).toBe("user-123");
  });

  it("no deja copia del identificador en sessionStorage", () => {
    setCurrentSessionUserId("user-123");

    expect(sessionStorage.getItem("umssy_current_user_id")).toBeNull();
  });

  it("recupera el userId de IndexedDB cuando la memoria se reinició", async () => {
    records.set("umssy_current_user_id", "persisted-user-456");
    const reloaded = await import("./session-user-id-storage");

    await reloaded.initializeSessionUserId();

    expect(reloaded.getCurrentSessionUserId()).toBe("persisted-user-456");
  });

  it("elimina el userId al llamar clearCurrentSessionUserId", async () => {
    setCurrentSessionUserId("temp-user");
    expect(getCurrentSessionUserId()).toBe("temp-user");

    clearCurrentSessionUserId();
    await initializeSessionUserId();

    expect(getCurrentSessionUserId()).toBeNull();
    expect(records.has("umssy_current_user_id")).toBe(false);
  });
});
