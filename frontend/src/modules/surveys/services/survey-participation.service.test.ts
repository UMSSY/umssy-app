import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/services/api-client";
import { apiResponse } from "../testing/survey-fixtures";
import { buildParticipation } from "../testing/survey-participation-fixtures";
import { surveyParticipationService } from "./survey-participation.service";

describe("surveyParticipationService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("obtiene la participación real con GET /surveys/:id/participation", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({ data: apiResponse(buildParticipation()) });

    await expect(surveyParticipationService.getParticipation("survey-1")).resolves.toEqual(apiResponse(buildParticipation()));
    expect(get).toHaveBeenCalledWith("/surveys/survey-1/participation");
  });

  it("envía recordatorios con POST /surveys/:id/reminders sin body de conteo", async () => {
    const result = { surveyId: "survey-1", pendingCount: 2, emailsDelivered: 2, emailsFailed: 0, pushStatus: "sent", sentAt: "2026-11-15T12:00:00.000Z" };
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: apiResponse(result) });

    await expect(surveyParticipationService.sendReminders("survey-1")).resolves.toEqual(apiResponse(result));
    expect(post).toHaveBeenCalledWith("/surveys/survey-1/reminders", {});
  });

  it("propaga el error del backend en lugar de simular un envío exitoso", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue(new Error("network"));

    await expect(surveyParticipationService.sendReminders("survey-1")).rejects.toThrow("network");
  });

  it("propaga el error al guardar alertas en lugar de confirmar un guardado falso", async () => {
    vi.spyOn(apiClient, "put").mockRejectedValue(new Error("network"));

    await expect(
      surveyParticipationService.saveAlertConfig("survey-1", { enabled: true, threshold: 10, questionIds: [] }),
    ).rejects.toThrow("network");
  });

  it("propaga el error al consultar la participación", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("network"));

    await expect(surveyParticipationService.getParticipation("survey-1")).rejects.toThrow("network");
  });
});
