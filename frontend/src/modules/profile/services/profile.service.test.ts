import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { buildProfile, CITIES } from "../testing/profile-fixtures";
import { profileService } from "./profile.service";

vi.mock("@/shared/config/env.config", () => ({
  ENV_CONFIG: { env: "local", apiUrl: "http://api.test/api" },
}));

const AUTH = { headers: { "x-user-id": "user-1" } };

describe("profileService", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DEV_USER_ID", "user-1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("does not send the user header when no dev user is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEV_USER_ID", "");
    const get = vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: buildProfile() });

    await profileService.getMyProfile();

    expect(get).toHaveBeenCalledWith("/profile/me", { headers: {} });
  });

  it("gets the profile of the logged user", async () => {
    const profile = buildProfile();
    const get = vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: profile });

    await expect(profileService.getMyProfile()).resolves.toEqual(profile);
    expect(get).toHaveBeenCalledWith("/profile/me", AUTH);
  });

  it("gets the cities catalog", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: CITIES });

    await expect(profileService.getCities()).resolves.toEqual(CITIES);
    expect(get).toHaveBeenCalledWith("/profile/cities");
  });

  it("updates the personal info and the presentation", async () => {
    const profile = buildProfile();
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValue({ data: profile });
    const personalInfo = {
      firstName: "Valeria",
      lastName: "Quispe",
      cityId: "city-cbba",
      phone: "70000000",
      personalEmail: "valeria@correo.com",
    };
    const presentation = {
      headline: "Desarrolladora",
      aboutMe: "Soy egresada de Ingeniería de Sistemas.",
      interestedOpportunities: "",
    };

    await profileService.updatePersonalInfo(personalInfo);
    await profileService.updatePresentation(presentation);

    expect(patch).toHaveBeenCalledWith("/profile/me/personal-info", personalInfo, AUTH);
    expect(patch).toHaveBeenCalledWith("/profile/me/presentation", presentation, AUTH);
  });

  it("uploads the photo as multipart form data", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValueOnce({ data: buildProfile() });
    const file = new File(["img"], "foto.png", { type: "image/png" });

    await profileService.uploadPhoto(file);

    const [url, body, config] = put.mock.calls[0];
    expect(url).toBe("/profile/me/photo");
    expect((body as FormData).get("photo")).toBe(file);
    expect(config).toEqual(AUTH);
  });

  it("removes the photo", async () => {
    const remove = vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ data: buildProfile() });

    await profileService.removePhoto();

    expect(remove).toHaveBeenCalledWith("/profile/me/photo", AUTH);
  });

  it("builds the public photo url", () => {
    expect(profileService.buildPhotoUrl("/profile/user-1/photo?v=1")).toBe(
      "http://api.test/api/profile/user-1/photo?v=1",
    );
    expect(profileService.buildPhotoUrl(null)).toBeNull();
  });
});
