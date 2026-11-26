import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { SURVEY_ALERTS_TEXT } from "../constants/survey-participation.constants";
import { surveyParticipationService } from "../services/survey-participation.service";
import { surveysService } from "../services/surveys.service";
import { apiResponse } from "../testing/survey-fixtures";
import { buildParticipation } from "../testing/survey-participation-fixtures";
import { buildStatistics } from "../testing/survey-statistics-fixtures";
import type { SurveyParticipation } from "../types/survey-participation.types";
import { SurveyAnalyticsView } from "./survey-analytics-view";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const STATISTICS = buildStatistics({ totalResponses: 48 });
const REMINDER_RESULT = {
  surveyId: "survey-1",
  pendingCount: 72,
  emailsDelivered: 72,
  emailsFailed: 0,
  pushStatus: "sent" as const,
  sentAt: "2026-11-15T12:00:00.000Z",
};

function mockParticipation(overrides: Partial<SurveyParticipation> = {}) {
  return vi
    .spyOn(surveyParticipationService, "getParticipation")
    .mockResolvedValue(apiResponse(buildParticipation(overrides)));
}

async function renderLoaded(summary = "48 de 120 titulados han respondido") {
  renderWithQuery(<SurveyAnalyticsView id="survey-1" />);
  await screen.findByText(summary);
}

async function openAlerts(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: SURVEY_ALERTS_TEXT.trigger }));
  return screen.findByRole("dialog", { name: SURVEY_ALERTS_TEXT.title });
}

describe("SurveyAnalyticsView - participación y alertas", () => {
  beforeEach(() => {
    vi.spyOn(surveysService, "getSurveyStatistics").mockResolvedValue(apiResponse(STATISTICS));
    mockParticipation();
    vi.spyOn(surveyParticipationService, "getAlertConfig").mockResolvedValue(
      apiResponse({ enabled: true, threshold: 10, questionIds: ["question-1"] }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("muestra la tasa de respuesta, la audiencia y el último recordatorio", async () => {
    await renderLoaded();

    const card = screen.getByLabelText("Tasa de respuesta", { selector: "[data-slot=card]" });
    expect(within(card).getByText("40%")).toBeInTheDocument();
    expect(within(card).getByText("48 de 120 titulados han respondido")).toBeInTheDocument();
    expect(within(card).getByText("Audiencia: Titulados · Ingeniería de Sistemas · Gestión 2020")).toBeInTheDocument();
    expect(within(card).getByText("Último recordatorio: 05/11/2026")).toBeInTheDocument();
    expect(within(card).getByRole("progressbar", { name: "Tasa de respuesta" })).toHaveAttribute("aria-valuenow", "40");
  });

  it.each([
    [35, 42, "Participación baja", "bg-danger"],
    [36, 43, "Participación media", "bg-gold"],
    [65, 78, "Participación media", "bg-gold"],
    [66, 79, "Participación esperada", "bg-success"],
    [100, 120, "Participación esperada", "bg-success"],
  ])("pinta el meter con %i%% según su rango", async (responseRate, respondedCount, label, colorClass) => {
    mockParticipation({ responseRate, respondedCount, pendingCount: 120 - respondedCount });
    await renderLoaded(`${respondedCount} de 120 titulados han respondido`);

    const card = screen.getByLabelText("Tasa de respuesta", { selector: "[data-slot=card]" });
    const meter = within(card).getByRole("progressbar", { name: "Tasa de respuesta" });
    const meterRoot = card.querySelector("[data-slot=progress]");
    expect(within(card).getByText(label)).toBeInTheDocument();
    expect(meter).toHaveAttribute("aria-valuetext", `${responseRate}% · ${label}`);
    expect(meterRoot).toHaveClass(`**:data-[slot=progress-indicator]:${colorClass}`);
  });

  it("muestra la cantidad exacta de pendientes en el botón", async () => {
    await renderLoaded();

    expect(screen.getByRole("button", { name: "Enviar recordatorio (72 pendientes)" })).toBeEnabled();
  });

  it("deshabilita el recordatorio cuando no hay pendientes", async () => {
    mockParticipation({ respondedCount: 120, pendingCount: 0, responseRate: 100, canSendReminder: false });
    await renderLoaded("120 de 120 titulados han respondido");

    expect(screen.getByRole("button", { name: "Todos los titulados han respondido" })).toBeDisabled();
  });

  it("pide confirmación antes de enviar y no envía si se cancela", async () => {
    const user = userEvent.setup();
    const send = vi.spyOn(surveyParticipationService, "sendReminders");
    await renderLoaded();

    await user.click(screen.getByRole("button", { name: "Enviar recordatorio (72 pendientes)" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Enviar recordatorio" });
    expect(within(dialog).getByText(/72 titulados/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(send).not.toHaveBeenCalled();
  });

  it("envía el recordatorio tras confirmar e informa la cantidad entregada", async () => {
    const user = userEvent.setup();
    const send = vi.spyOn(surveyParticipationService, "sendReminders").mockResolvedValue(apiResponse(REMINDER_RESULT));
    await renderLoaded();

    await user.click(screen.getByRole("button", { name: "Enviar recordatorio (72 pendientes)" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Enviar recordatorio" });
    await user.click(within(dialog).getByRole("button", { name: "Confirmar envío" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Se entregaron 72 recordatorios.", expect.anything()));
    expect(send).toHaveBeenCalledWith("survey-1");
    expect(surveyParticipationService.getParticipation).toHaveBeenCalledTimes(2);
  });

  it("informa entregas parciales sin ocultar los fallos", async () => {
    const user = userEvent.setup();
    vi.spyOn(surveyParticipationService, "sendReminders").mockResolvedValue(
      apiResponse({ ...REMINDER_RESULT, emailsDelivered: 70, emailsFailed: 2 }),
    );
    await renderLoaded();

    await user.click(screen.getByRole("button", { name: "Enviar recordatorio (72 pendientes)" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar envío" }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Se entregaron 70 recordatorios. No se pudo entregar a 2 titulados.",
        expect.anything(),
      ),
    );
  });

  it("muestra el error del backend y no confirma éxito si el envío falla", async () => {
    const user = userEvent.setup();
    vi.spyOn(surveyParticipationService, "sendReminders").mockRejectedValue({
      response: { data: { detail: "No se pudo entregar ningún recordatorio. Intente nuevamente más tarde" } },
    });
    await renderLoaded();

    await user.click(screen.getByRole("button", { name: "Enviar recordatorio (72 pendientes)" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar envío" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo entregar ningún recordatorio. Intente nuevamente más tarde",
        expect.anything(),
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("muestra un error honesto si no se puede cargar la participación", async () => {
    vi.spyOn(surveyParticipationService, "getParticipation").mockRejectedValue(new Error("network"));
    renderWithQuery(<SurveyAnalyticsView id="survey-1" />);

    expect(await screen.findByText("No se pudo cargar la participación de la encuesta.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enviar recordatorio/ })).not.toBeInTheDocument();
  });

  it("abre el modal con la configuración y actualiza el contador al marcar y desmarcar", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const dialog = await openAlerts(user);

    expect(within(dialog).getByRole("switch", { name: "Activar alertas" })).toBeChecked();
    expect(within(dialog).getByRole("textbox", { name: "Umbral de cambio" })).toHaveValue("10");
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

    const threshold = within(dialog).getByRole("textbox", { name: "Umbral de cambio" });
    await user.clear(threshold);
    await user.type(threshold, "60");
    await user.click(within(dialog).getByRole("button", { name: "Desmarcar todas" }));
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    expect(within(dialog).getByText(SURVEY_ALERTS_TEXT.thresholdMax)).toBeInTheDocument();
    expect(within(dialog).getByText(SURVEY_ALERTS_TEXT.questionsError)).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it("permite guardar sin preguntas cuando las alertas están desactivadas", async () => {
    const user = userEvent.setup();
    const save = vi
      .spyOn(surveyParticipationService, "saveAlertConfig")
      .mockResolvedValue(apiResponse({ saved: true, enabled: false, threshold: 10, questionIds: [] }));
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
    const save = vi
      .spyOn(surveyParticipationService, "saveAlertConfig")
      .mockResolvedValue(apiResponse({ saved: true, enabled: true, threshold: 10, questionIds: ["question-1", "question-2"] }));
    await renderLoaded();
    const dialog = await openAlerts(user);

    await user.click(within(dialog).getByRole("checkbox", { name: /¿Qué competencias usas/ }));
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(save).toHaveBeenCalledWith("survey-1", { enabled: true, threshold: 10, questionIds: ["question-1", "question-2"] }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("no confirma el guardado si el backend falla", async () => {
    const user = userEvent.setup();
    vi.spyOn(surveyParticipationService, "saveAlertConfig").mockRejectedValue(new Error("network"));
    await renderLoaded();
    const dialog = await openAlerts(user);

    await user.click(within(dialog).getByRole("checkbox", { name: /¿Qué competencias usas/ }));
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SURVEY_ALERTS_TEXT.saveError, expect.anything()));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("muestra un error si no se puede cargar la configuración de alertas", async () => {
    const user = userEvent.setup();
    vi.spyOn(surveyParticipationService, "getAlertConfig").mockRejectedValue(new Error("network"));
    await renderLoaded();
    const dialog = await openAlerts(user);

    expect(await within(dialog).findByText(SURVEY_ALERTS_TEXT.loadError)).toBeInTheDocument();
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
