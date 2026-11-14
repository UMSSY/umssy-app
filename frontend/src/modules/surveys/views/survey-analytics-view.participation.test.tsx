import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { SURVEY_ALERTS_TEXT } from "../constants/survey-participation.constants";
import { surveyParticipationService } from "../services/survey-participation.service";
import { surveysService } from "../services/surveys.service";
import { apiResponse } from "../testing/survey-fixtures";
import { buildStatistics } from "../testing/survey-statistics-fixtures";
import { SurveyAnalyticsView } from "./survey-analytics-view";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const STATISTICS = buildStatistics({ totalResponses: 48 });

async function renderLoaded() {
  renderWithQuery(<SurveyAnalyticsView id="survey-1" />);
  await screen.findByText("48 de 120 titulados han respondido");
}

async function openAlerts(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: SURVEY_ALERTS_TEXT.trigger }));
  return screen.findByRole("dialog", { name: SURVEY_ALERTS_TEXT.title });
}

describe("SurveyAnalyticsView - participación y alertas", () => {
  beforeEach(() => {
    vi.spyOn(surveysService, "getSurveyStatistics").mockResolvedValue(apiResponse(STATISTICS));
    vi.spyOn(surveyParticipationService, "getAudience").mockResolvedValue(
      apiResponse({ surveyId: "survey-1", totalAudience: 120, audienceLabel: "Ingeniería de Sistemas · Titulados 2020", lastReminderAt: "2026-11-05T14:00:00.000Z" }),
    );
    vi.spyOn(surveyParticipationService, "getAlertConfig").mockResolvedValue(apiResponse({ enabled: true, threshold: 10, questionIds: ["question-1"] }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("muestra la tasa de respuesta, la audiencia y el último recordatorio", async () => {
    await renderLoaded();

    expect(screen.getByText("48 de 120 titulados han respondido")).toBeInTheDocument();
    expect(screen.getByText("Audiencia: Ingeniería de Sistemas · Titulados 2020")).toBeInTheDocument();
    expect(screen.getByText("Último recordatorio: 05/11/2026")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Tasa de respuesta" })).toHaveAttribute("aria-valuenow", "40");
  });

  it("envía el recordatorio a los pendientes y confirma con un toast", async () => {
    const user = userEvent.setup();
    const sendReminder = vi.spyOn(surveyParticipationService, "sendReminder");
    await renderLoaded();

    await user.click(screen.getByRole("button", { name: "Enviar recordatorio · 72 pendientes" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Recordatorio enviado a 72 titulados pendientes.", expect.anything()));
    expect(sendReminder).toHaveBeenCalledWith("survey-1", 72);
  });

  it("abre el modal con la configuración y actualiza el contador al marcar y desmarcar", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const dialog = await openAlerts(user);

    expect(within(dialog).getByRole("switch", { name: "Activar alertas" })).toBeChecked();
    expect(within(dialog).getByRole("spinbutton", { name: "Umbral de cambio" })).toHaveValue(10);
    expect(within(dialog).getByText("1 de 2")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Marcar todas" }));
    expect(within(dialog).getByText("2 de 2")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Desmarcar todas" }));
    expect(within(dialog).getByText("0 de 2")).toBeInTheDocument();
  });

  it("valida el umbral y las preguntas antes de guardar", async () => {
    const user = userEvent.setup();
    const save = vi.spyOn(surveyParticipationService, "saveAlertConfig");
    await renderLoaded();
    const dialog = await openAlerts(user);

    const threshold = within(dialog).getByRole("spinbutton", { name: "Umbral de cambio" });
    await user.clear(threshold);
    await user.type(threshold, "60");
    await user.click(within(dialog).getByRole("button", { name: "Desmarcar todas" }));
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    expect(within(dialog).getByText(SURVEY_ALERTS_TEXT.thresholdError)).toBeInTheDocument();
    expect(within(dialog).getByText(SURVEY_ALERTS_TEXT.questionsError)).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it("permite guardar sin preguntas cuando las alertas están desactivadas", async () => {
    const user = userEvent.setup();
    const save = vi.spyOn(surveyParticipationService, "saveAlertConfig");
    await renderLoaded();
    const dialog = await openAlerts(user);

    await user.click(within(dialog).getByRole("button", { name: "Desmarcar todas" }));
    await user.click(within(dialog).getByRole("switch", { name: "Activar alertas" }));
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(SURVEY_ALERTS_TEXT.saved, expect.anything()));
    expect(save).toHaveBeenCalledWith("survey-1", { enabled: false, threshold: 10, questionIds: [] });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("guarda una configuración válida y cierra el modal", async () => {
    const user = userEvent.setup();
    const save = vi.spyOn(surveyParticipationService, "saveAlertConfig");
    await renderLoaded();
    const dialog = await openAlerts(user);

    await user.click(within(dialog).getByRole("checkbox", { name: /¿Qué competencias usas/ }));
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(save).toHaveBeenCalledWith("survey-1", { enabled: true, threshold: 10, questionIds: ["question-1", "question-2"] }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cancelar cierra el modal sin guardar", async () => {
    const user = userEvent.setup();
    const save = vi.spyOn(surveyParticipationService, "saveAlertConfig");
    await renderLoaded();
    const dialog = await openAlerts(user);

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(save).not.toHaveBeenCalled();
  });
});
