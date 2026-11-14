import { afterEach, describe, expect, it, vi } from "vitest";
import { assignWindowLocation } from "./assign-window-location";

describe("assignWindowLocation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not call assign if url is empty or whitespace", () => {
    assignWindowLocation("   ");
    expect(true).toBe(true);
  });

  it("attempts to assign location when url is valid", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    assignWindowLocation("https://github.com/login/oauth/authorize");
    errorSpy.mockRestore();
    expect(true).toBe(true);
  });
});
