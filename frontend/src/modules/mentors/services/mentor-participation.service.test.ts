import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import {
  getMentorParticipation,
  updateMentorParticipation,
} from "./mentor-participation.service";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("mentor participation service", () => {
  it("loads participation state and saved preferences", async () => {
    const participation = {
      isActive: false,
      areas: ["Backend"],
      orientations: ["Orientación técnica"],
    };
    const signal = new AbortController().signal;
    const request = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        statusCode: 200,
        ok: true,
        detail: "Operación exitosa",
        data: participation,
      },
    });

    await expect(getMentorParticipation(signal)).resolves.toBe(participation);
    expect(request).toHaveBeenCalledWith("/mentors/me/participation", {
      signal,
    });
  });

  it.each([true, false])(
    "updates participation status to %s",
    async (isActive) => {
      const request = vi.spyOn(apiClient, "patch").mockResolvedValue({
        data: {
          statusCode: 200,
          ok: true,
          detail: "Operación exitosa",
          data: { id: "user-1", isAvailableForMentoring: isActive },
        },
      });

      await expect(updateMentorParticipation(isActive)).resolves.toBeUndefined();
      expect(request).toHaveBeenCalledWith("/mentors/me/participation", {
        isActive,
      });
    },
  );
});
