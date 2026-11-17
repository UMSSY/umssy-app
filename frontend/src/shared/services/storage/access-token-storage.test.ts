import "@/shared/testing/indexed-db.mock";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCESS_TOKEN_STORAGE_KEY } from "@/shared/constants/auth.constants";
import { readIndexedDb, writeIndexedDb } from "./browser-indexed-db";
import {
  clearAccessToken,
  getAccessToken,
  initializeAccessTokenStorage,
  saveAccessToken,
  subscribeAccessToken,
} from "./access-token-storage";

describe("access token memory storage (no IndexedDB persistence)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps token in memory without persisting it into IndexedDB, localStorage or sessionStorage", async () => {
    expect(await saveAccessToken("token-value")).toBe(true);
    expect(getAccessToken()).toBe("token-value");
    expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(Object.values(sessionStorage)).not.toContain("token-value");
    expect(Object.values(localStorage)).not.toContain("token-value");
  });

  it("removes any legacy token from IndexedDB during initialization", async () => {
    await writeIndexedDb(ACCESS_TOKEN_STORAGE_KEY, "legacy-token");
    vi.resetModules();
    const storage = await import("./access-token-storage");
    expect(storage.isAccessTokenReady()).toBe(false);
    await storage.initializeAccessTokenStorage();
    expect(storage.isAccessTokenReady()).toBe(true);
    expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(storage.getAccessToken()).toBeNull();
    storage.clearAccessToken();
  });

  it("invalidates the in-memory snapshot immediately on logout", async () => {
    await saveAccessToken("token-value");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
    await saveAccessToken("replacement");
    expect(await readIndexedDb(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getAccessToken()).toBe("replacement");
  });

  it("notifies subscribers after login and logout", async () => {
    await initializeAccessTokenStorage();
    const listener = vi.fn();
    const unsubscribe = subscribeAccessToken(listener);
    await saveAccessToken("token-a");
    expect(listener).toHaveBeenCalled();
    listener.mockClear();
    clearAccessToken();
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });
});
