import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MENTOR_DIRECTORY_FIXTURES } from "../fixtures/mentor-directory.fixtures";
import { MENTOR_PROFILES } from "../fixtures/mentor-profiles.fixtures";
import { getMentorDirectory, getMentorProfile } from "./mentor-query.mock";

beforeEach(() => { vi.useFakeTimers(); window.history.replaceState({}, "", "/"); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); window.history.replaceState({}, "", "/"); });

describe("Temporary mentor query service", () => {
  it("uses the same identity and information for every card and profile", async () => {
    const pending = getMentorDirectory();
    await vi.runAllTimersAsync();
    const directory = await pending;
    expect(directory).toHaveLength(6);
    for (const card of directory) {
      const pendingProfile = getMentorProfile(card.id);
      await vi.runAllTimersAsync();
      const profile = await pendingProfile;
      expect(profile?.name).toBe(card.fullName);
      expect(profile?.technicalAreas).toEqual(card.technicalAreas);
      expect(profile?.isAvailable).toBe(card.isAvailable);
    }
    expect(MENTOR_PROFILES).toHaveLength(MENTOR_DIRECTORY_FIXTURES.length);
  });

  it("returns null for unknown and malformed identifiers", async () => {
    for (const id of ["999", "01", "1abc"]) {
      const pending = getMentorProfile(id);
      await vi.runAllTimersAsync();
      expect(await pending).toBeNull();
    }
  });

  it("supports an empty directory in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    window.history.replaceState({}, "", "/?demo=empty");
    const pending = getMentorDirectory();
    await vi.runAllTimersAsync();
    expect(await pending).toEqual([]);
  });

  it("simulates one failure followed by a successful retry", async () => {
    vi.stubEnv("NODE_ENV", "development");
    window.history.replaceState({}, "", "/?demo=error");
    const pending = expect(getMentorProfile("3")).rejects.toThrow("No se pudo cargar");
    await vi.runAllTimersAsync();
    await pending;
    const retry = getMentorProfile("3");
    await vi.runAllTimersAsync();
    expect((await retry)?.id).toBe(3);
  });

  it("ignores demonstration parameters outside development", async () => {
    window.history.replaceState({}, "", "/?demo=empty");
    const pending = getMentorDirectory();
    await vi.runAllTimersAsync();
    expect(await pending).toHaveLength(6);
  });

  it("cancels an in-flight request", async () => {
    const controller = new AbortController();
    const pending = expect(getMentorDirectory(controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();
    await pending;
  });

  it("rejects an already canceled request", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(getMentorDirectory(controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});

