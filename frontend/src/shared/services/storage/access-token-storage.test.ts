import { afterEach, describe, expect, it } from "vitest";
import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
  subscribeAccessToken,
} from "./access-token-storage";

describe("access token storage", () => {
  it('invalidates another tab session after logout and accepts a new login', () => {
    saveAccessToken('token-a');
    const copiedSession = { ...sessionStorage };
    clearAccessToken();
    sessionStorage.clear();
    for (const [key, value] of Object.entries(copiedSession)) sessionStorage.setItem(key, value);
    expect(getAccessToken()).toBeNull();
    saveAccessToken('token-b');
    expect(getAccessToken()).toBe('token-b');
    expect(Object.values(localStorage)).not.toContain('token-a');
    expect(Object.values(localStorage)).not.toContain('token-b');
  });

  it('notifies mounted views when another tab changes the logout marker', () => {
    saveAccessToken('token-a');
    const observed: Array<string | null> = [];
    const unsubscribe = subscribeAccessToken(() => observed.push(getAccessToken()));
    localStorage.setItem('umssy-session-logout', 'another-tab-logout');
    window.dispatchEvent(new StorageEvent('storage', { key: 'umssy-session-logout', newValue: 'another-tab-logout' }));
    expect(observed).toEqual([null]);
    unsubscribe();
  });
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("stores and reads the access token", () => {
    expect(saveAccessToken("token-value")).toBe(true);
    expect(getAccessToken()).toBe("token-value");
  });

  it("removes the access token", () => {
    saveAccessToken("token-value");

    expect(clearAccessToken()).toBe(true);
    expect(getAccessToken()).toBeNull();
  });
});
