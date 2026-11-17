import "@/shared/testing/indexed-db.mock";
import { afterEach, describe, expect, it } from "vitest";
import { getAuthToken, getAccessToken } from "./auth-token";
import {
  saveAccessToken,
  clearAccessToken,
} from "@/shared/services/storage/access-token-storage";

describe("auth-token centralized reader", () => {
  afterEach(() => {
    clearAccessToken();
  });

  it("returns null when no token is present in memory", () => {
    expect(getAuthToken()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("returns the in-memory token when saved during active session", async () => {
    await saveAccessToken("mock-jwt-token");
    expect(getAuthToken()).toBe("mock-jwt-token");
    expect(getAccessToken()).toBe("mock-jwt-token");
  });
});
