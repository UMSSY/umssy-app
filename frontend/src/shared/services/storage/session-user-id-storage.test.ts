import { describe, it, expect, beforeEach } from "vitest";
import {
  getCurrentSessionUserId,
  setCurrentSessionUserId,
  clearCurrentSessionUserId,
} from "./session-user-id-storage";

describe("session-user-id-storage", () => {
  beforeEach(() => {
    clearCurrentSessionUserId();
    sessionStorage.clear();
  });

  it("almacena y retorna el userId en memoria y en sessionStorage", () => {
    expect(getCurrentSessionUserId()).toBeNull();

    setCurrentSessionUserId("user-123");
    expect(getCurrentSessionUserId()).toBe("user-123");
    expect(sessionStorage.getItem("umssy_current_user_id")).toBe("user-123");
  });

  it("recupera el userId desde sessionStorage si la memoria se reinició (F5)", () => {
    sessionStorage.setItem("umssy_current_user_id", "persisted-user-456");

    expect(getCurrentSessionUserId()).toBe("persisted-user-456");
  });

  it("elimina el userId al llamar clearCurrentSessionUserId", () => {
    setCurrentSessionUserId("temp-user");
    expect(getCurrentSessionUserId()).toBe("temp-user");

    clearCurrentSessionUserId();
    expect(getCurrentSessionUserId()).toBeNull();
    expect(sessionStorage.getItem("umssy_current_user_id")).toBeNull();
  });
});
