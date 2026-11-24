
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { mentorParticipationService } from "./mentor-participation.service";

afterEach(() => vi.restoreAllMocks());

describe("mentor participation service HU-MEN-06", () => {
  it("consulta el estado y las preferencias del usuario autenticado", async () => {
    const state = {
      status: "DEACTIVATED",
      areas: [{ id: "a", name: "Backend" }],
      orientations: [],
    };

    const get = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { data: state },
    });

    const signal = new AbortController().signal;

    await expect(
      mentorParticipationService.getMyParticipation(signal),
    ).resolves.toEqual(state);

    expect(get).toHaveBeenCalledWith("/mentors/me/participation", {
      signal,
    });
  });

  it("usa la salida real y rechaza respuestas parciales", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({});

    await mentorParticipationService.leave();

    expect(post).toHaveBeenCalledWith("/mentors/me/leave");

    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        data: {
          status: "ACTIVE",
          areas: null,
        },
      },
    });

    await expect(
      mentorParticipationService.getMyParticipation(),
    ).rejects.toThrow("Respuesta de participación inválida");
  });
});

describe("mentor participation history HU14", () => {
  it("consulta el historial de solicitudes del mentor autenticado", async () => {
    const history = [
      {
        id: "request-1",
        userId: "mentor-1",
        status: "PENDING",
        queuedAt: "2026-11-15T10:00:00.000Z",
        createdAt: "2026-11-15T10:00:00.000Z",
        updatedAt: "2026-11-15T10:00:00.000Z",
        technicalAreaIds: ["area-1"],
        orientationTypeIds: ["orientation-1"],
        statusId: "status-1",
      },
    ];

    const get = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { data: history },
    });

    const signal = new AbortController().signal;

    await expect(
      mentorParticipationService.getHistory(signal),
    ).resolves.toEqual(history);

    expect(get).toHaveBeenCalledWith(
      "/mentor-participation/requests/me/history",
      { signal },
    );
  });

  it("devuelve un arreglo vacío cuando el mentor no tiene historial", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: { data: [] },
    });

    await expect(
      mentorParticipationService.getHistory(),
    ).resolves.toEqual([]);

    expect(get).toHaveBeenCalledWith(
      "/mentor-participation/requests/me/history",
      { signal: undefined },
    );
  });
});
