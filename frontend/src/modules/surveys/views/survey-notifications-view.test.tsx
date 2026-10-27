import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper";
import { surveyNotificationsService } from "../services/survey-notifications.service";
import type { SurveyNotification } from "../types/survey-notification.types";
import { SurveyNotificationsView } from "./survey-notifications-view";

const SURVEYS: SurveyNotification[] = [
  { id: "employability-2026", title: "Encuesta de empleabilidad 2026", publishedAt: "2026-10-15", status: "pending" },
  { id: "satisfaction-2025", title: "Encuesta de satisfacción 2025", publishedAt: "2026-09-20", status: "expired" },
  { id: "graduate-follow-up", title: "Encuesta de seguimiento a titulados", publishedAt: "2026-10-02", status: "pending" },
  { id: "job-placement", title: "Encuesta de inserción laboral", publishedAt: "2026-09-20", status: "answered" },
  { id: "data-update", title: "Encuesta de actualización de datos", publishedAt: "2026-07-25", status: "answered" },
];

function mockSurveys(surveys: SurveyNotification[]) {
  vi.spyOn(surveyNotificationsService, "getNotifications").mockResolvedValue(surveys);
}

function renderView() {
  const { wrapper } = createQueryWrapper();
  return render(<SurveyNotificationsView />, { wrapper });
}

async function findSurveyRow(title: string): Promise<HTMLElement> {
  const row = (await screen.findByRole("heading", { name: title })).closest("li");
  if (!row) throw new Error(`No se encontró la fila de ${title}`);
  return row;
}

describe("SurveyNotificationsView", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("muestra el título, todas las encuestas y cuántas están pendientes", async () => {
    mockSurveys(SURVEYS);
    renderView();

    expect(screen.getByRole("heading", { level: 1, name: "Notificaciones de encuestas" })).toBeInTheDocument();
    const surveyList = screen.getByRole("region", { name: "Encuestas" });
    expect(await within(surveyList).findAllByRole("listitem")).toHaveLength(5);
    expect(within(surveyList).getByText("2 pendientes")).toBeInTheDocument();
  });

  it("actualiza el contador según la cantidad de encuestas pendientes", async () => {
    mockSurveys(
      Array.from({ length: 5 }, (_, index) => ({
        id: `pending-${index}`,
        title: `Encuesta pendiente ${index + 1}`,
        publishedAt: "2026-10-15",
        status: "pending" as const,
      })),
    );
    renderView();

    expect(await screen.findByText("5 pendientes")).toBeInTheDocument();
  });

  it("permite responder solo las encuestas pendientes", async () => {
    mockSurveys(SURVEYS);
    renderView();

    const answerLinks = await screen.findAllByRole("link", { name: "Responder encuesta" });
    expect(answerLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/surveys/employability-2026",
      "/surveys/graduate-follow-up",
    ]);
    expect(screen.getAllByText("Nueva encuesta disponible para responder.")).toHaveLength(2);
  });

  it("marca la encuesta caducada como caducada y sin opción de responder", async () => {
    mockSurveys(SURVEYS);
    renderView();

    const row = await findSurveyRow("Encuesta de satisfacción 2025");
    expect(within(row).getByText("Esta encuesta estuvo disponible por un tiempo limitado.")).toBeInTheDocument();
    expect(within(row).getAllByText("Encuesta caducada")).toHaveLength(1);
    expect(within(row).queryByText("Encuesta pendiente")).not.toBeInTheDocument();
    expect(within(row).queryByRole("link")).not.toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Encuesta caducada" })).toBeDisabled();
  });

  it("marca las encuestas respondidas como registradas, con su fecha y sin acciones", async () => {
    mockSurveys(SURVEYS);
    renderView();

    const row = await findSurveyRow("Encuesta de inserción laboral");
    expect(
      within(row).getByText("Gracias por completar la encuesta. Tu información ha sido registrada correctamente."),
    ).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Encuesta registrada" })).toBeDisabled();
    expect(within(row).getAllByText("Encuesta registrada")).toHaveLength(1);
    expect(within(row).queryByRole("link")).not.toBeInTheDocument();
    expect(within(row).getByText("20 sep. 2026")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando el servicio no devuelve encuestas", async () => {
    mockSurveys([]);
    renderView();

    expect(await screen.findByRole("heading", { name: "No hay encuestas disponibles" })).toBeInTheDocument();
    expect(screen.getByText("Cuando tengas una nueva encuesta asignada, aparecerá aquí.")).toBeInTheDocument();
    expect(screen.queryByText(/pendiente/)).not.toBeInTheDocument();
  });

  it("muestra un error cuando no se pueden cargar las encuestas", async () => {
    vi.spyOn(surveyNotificationsService, "getNotifications").mockRejectedValue(new Error("fallo"));
    renderView();

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron cargar tus encuestas.");
  });
});
