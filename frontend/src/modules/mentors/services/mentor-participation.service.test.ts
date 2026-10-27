import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { mentorParticipationService } from "./mentor-participation.service";

afterEach(() => vi.restoreAllMocks());

describe("mentor participation service HU-MEN-06", () => {
  it("consulta el estado y las preferencias del usuario autenticado", async () => {
    const state = { status: "DEACTIVATED", areas: [{ id: "a", name: "Backend" }], orientations: [] };
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ data: { data: state } });
    const signal = new AbortController().signal;
    await expect(mentorParticipationService.getMyParticipation(signal)).resolves.toEqual(state);
    expect(get).toHaveBeenCalledWith("/mentors/me/participation", { signal });
  });

  it("usa la salida real y rechaza respuestas parciales", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({});
    await mentorParticipationService.leave();
    expect(post).toHaveBeenCalledWith("/mentors/me/leave");
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: { data: { status: "ACTIVE", areas: null } } });
    await expect(mentorParticipationService.getMyParticipation()).rejects.toThrow("Respuesta de participación inválida");
  });
});
