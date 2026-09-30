import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { profileService } from "../services/profile.service";
import { buildAxiosError, buildProfile, CITIES } from "../testing/profile-fixtures";
import { useProfile } from "./use-profile";

describe("useProfile", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("loads the profile and the cities", async () => {
    const profile = buildProfile();
    vi.spyOn(profileService, "getMyProfile").mockResolvedValue(profile);
    vi.spyOn(profileService, "getCities").mockResolvedValue(CITIES);

    const { result } = renderHook(() => useProfile());

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.profile).toEqual(profile);
    expect(result.current.cities).toEqual(CITIES);
  });

  it("exposes the error and can reload", async () => {
    const getMyProfile = vi
      .spyOn(profileService, "getMyProfile")
      .mockRejectedValueOnce(buildAxiosError(404, { message: "No se encontró el perfil del egresado." }))
      .mockResolvedValueOnce(buildProfile());
    vi.spyOn(profileService, "getCities").mockResolvedValue(CITIES);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMessage).toBe("No se encontró el perfil del egresado.");

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(getMyProfile).toHaveBeenCalledTimes(2);
  });

  it("replaces the profile after a mutation", async () => {
    vi.spyOn(profileService, "getMyProfile").mockResolvedValue(buildProfile());
    vi.spyOn(profileService, "getCities").mockResolvedValue(CITIES);

    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.status).toBe("success"));

    act(() => result.current.replaceProfile(buildProfile({ firstName: "Ana" })));

    expect(result.current.profile?.firstName).toBe("Ana");
  });

  it("ignores responses after unmount", async () => {
    let resolveProfile: (profile: ReturnType<typeof buildProfile>) => void = () => {};
    vi.spyOn(profileService, "getMyProfile").mockReturnValue(
      new Promise((resolve) => {
        resolveProfile = resolve;
      }),
    );
    vi.spyOn(profileService, "getCities").mockResolvedValue(CITIES);

    const { result, unmount } = renderHook(() => useProfile());
    unmount();
    resolveProfile(buildProfile());

    await Promise.resolve();
    expect(result.current.status).toBe("loading");
  });
});
