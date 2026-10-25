import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { deactivateMentorParticipation } from "./mentor-participation.service";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("mentor participation service", () => {
  it("deactivates the authenticated mentor participation", async () => {
    const request = vi.spyOn(apiClient, "delete").mockResolvedValue({
      data: {
        statusCode: 200,
        ok: true,
        detail: "Operación exitosa",
        data: { id: "user-1" },
      },
    });

    await expect(deactivateMentorParticipation()).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith("/mentors/me/participation");
  });
});
