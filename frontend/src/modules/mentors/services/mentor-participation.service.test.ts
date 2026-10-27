import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { mentorParticipationService } from "./mentor-participation.service";
import { activateMentor } from "@/modules/mentorship/services/mentor-activation.service";
import { clearMentorIntakeIntentions } from "@/modules/mentorship/services/mentor-intake-idempotency";

beforeEach(() => {
  sessionStorage.setItem("accessToken", `h.${btoa(JSON.stringify({ sub: crypto.randomUUID() }))}.s`);
});
afterEach(async () => { await clearMentorIntakeIntentions(); sessionStorage.clear(); vi.restoreAllMocks(); });

const preferences = { technicalAreaIds: ["area-1"], orientationTypeIds: ["orientation-1"] };
const request = { id: "request-1", userId: "jwt-user", status: "PENDING", queuedAt: "2026-10-27T12:00:00Z", createdAt: "2026-10-27T12:00:00Z", ...preferences };

describe("mentor participation service HU-MEN-06", () => {
  it("cancelar una solicitud confirmada inicia otra intención aunque la respuesta de creación se haya perdido", async () => {
    const post = vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("network")).mockResolvedValue({ data: { data: request } });
    await expect(mentorParticipationService.create(preferences)).rejects.toThrow("network");
    const original = post.mock.calls[0][2]?.headers?.["Idempotency-Key"];
    vi.spyOn(apiClient, "delete").mockResolvedValue({ data: { data: { ...request, status: "CANCELLED" } } });
    await mentorParticipationService.cancel();
    await mentorParticipationService.create(preferences);
    expect(post.mock.calls[1][2]?.headers?.["Idempotency-Key"]).not.toBe(original);
  });

  it.each(["leave", "confirm"] as const)("%s confirmado separa una activación nueva de otra respuesta de red ambigua", async (operation) => {
    const post = vi.spyOn(apiClient, "post")
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: { data: { id: "user-1" } } });
    await expect(activateMentor(preferences)).rejects.toThrow("network");
    const original = post.mock.calls[0][2]?.headers?.["Idempotency-Key"];
    if (operation === "leave") await mentorParticipationService.leave();
    else await mentorParticipationService.confirm("offer-1");
    await activateMentor(preferences);
    expect(post.mock.calls[2][2]?.headers?.["Idempotency-Key"]).not.toBe(original);
  });

  it("una salida fallida conserva la clave para reintentar una activación ambigua", async () => {
    const post = vi.spyOn(apiClient, "post")
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new Error("future appointments"))
      .mockResolvedValueOnce({ data: { data: { id: "user-1" } } });
    await expect(activateMentor(preferences)).rejects.toThrow("network");
    const original = post.mock.calls[0][2]?.headers?.["Idempotency-Key"];
    await expect(mentorParticipationService.leave()).rejects.toThrow("future appointments");
    await activateMentor(preferences);
    expect(post.mock.calls[2][2]?.headers?.["Idempotency-Key"]).toBe(original);
  });
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
