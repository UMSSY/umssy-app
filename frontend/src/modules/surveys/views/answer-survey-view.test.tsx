import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { surveysService } from "../services/surveys.service";
import { apiResponse } from "../testing/survey-fixtures";
import type { SurveyDetail } from "../types/survey.types";
import { AnswerSurveyView } from "./answer-survey-view";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const MOCK_SURVEY: SurveyDetail = {
  id: "survey-123",
  title: "Encuesta de Seguimiento a Titulados",
  description: "Queremos conocer tu situación laboral actual.",
  status: "published",
  career: null,
  academicPeriod: "II-2026",
  opensAt: "2026-10-01T00:00:00.000Z",
  closesAt: "2026-12-31T23:59:59.000Z",
  hasAnswered: false,
  isExpired: false,
  questions: [
    {
      id: "q-1",
      position: 1,
      statement: "¿Trabajas actualmente en tu área de estudio?",
      type: "single_choice",
      isRequired: true,
      options: [
        { id: "opt-1a", position: 1, label: "Sí, a tiempo completo" },
        { id: "opt-1b", position: 2, label: "Sí, a tiempo parcial" },
        { id: "opt-1c", position: 3, label: "No" },
      ],
    },
    {
      id: "q-2",
      position: 2,
      statement: "¿Qué habilidades consideras más necesarias?",
      type: "multiple_choice",
      isRequired: false,
      options: [
        { id: "opt-2a", position: 1, label: "Programación avanzada" },
        { id: "opt-2b", position: 2, label: "Gestión de proyectos" },
        { id: "opt-2c", position: 3, label: "Habilidades blandas" },
      ],
    },
  ],
};

describe("AnswerSurveyView", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("muestra el título, descripción y preguntas de la encuesta", async () => {
    vi.spyOn(surveysService, "getSurvey").mockResolvedValue(
      apiResponse(MOCK_SURVEY),
    );

    renderWithQuery(<AnswerSurveyView id="survey-123" />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Encuesta de Seguimiento a Titulados",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Queremos conocer tu situación laboral actual."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/¿Trabajas actualmente en tu área de estudio\?/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/¿Qué habilidades consideras más necesarias\?/),
    ).toBeInTheDocument();

  });

  it("muestra estado de error si la encuesta no se puede cargar", async () => {
    vi.spyOn(surveysService, "getSurvey").mockRejectedValue(
      new Error("Error de conexión"),
    );

    renderWithQuery(<AnswerSurveyView id="survey-unknown" />);

    expect(
      await screen.findByRole("heading", { name: "No se pudo cargar la encuesta" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Error de conexión")).toBeInTheDocument();
  });

  it("muestra aviso de encuesta completada si el titulado ya respondió", async () => {
    vi.spyOn(surveysService, "getSurvey").mockResolvedValue(
      apiResponse({ ...MOCK_SURVEY, hasAnswered: true }),
    );

    renderWithQuery(<AnswerSurveyView id="survey-123" />);

    expect(
      await screen.findByRole("heading", { name: "¡Encuesta completada!" }),
    ).toBeInTheDocument();
  });

  it("muestra aviso de encuesta caducada si ya expiró", async () => {
    vi.spyOn(surveysService, "getSurvey").mockResolvedValue(
      apiResponse({ ...MOCK_SURVEY, isExpired: true }),
    );

    renderWithQuery(<AnswerSurveyView id="survey-123" />);

    expect(
      await screen.findByRole("heading", { name: "Encuesta caducada" }),
    ).toBeInTheDocument();
  });

  it("valida preguntas obligatorias antes de enviar", async () => {
    const user = userEvent.setup();
    vi.spyOn(surveysService, "getSurvey").mockResolvedValue(
      apiResponse(MOCK_SURVEY),
    );

    renderWithQuery(<AnswerSurveyView id="survey-123" />);

    const submitBtn = await screen.findByRole("button", { name: /enviar respuestas/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText("Esta pregunta es obligatoria. Por favor selecciona una opción."),
    ).toBeInTheDocument();
  });

  it("permite seleccionar opciones y enviar respuestas exitosamente", async () => {
    const user = userEvent.setup();
    vi.spyOn(surveysService, "getSurvey").mockResolvedValue(
      apiResponse(MOCK_SURVEY),
    );
    const submitSpy = vi.spyOn(surveysService, "submitAnswers").mockResolvedValue(
      apiResponse({ success: true, message: "Guardado" }),
    );

    renderWithQuery(<AnswerSurveyView id="survey-123" />);

    const radioOption = await screen.findByText("Sí, a tiempo completo");
    await user.click(radioOption);

    const checkboxOption = screen.getByText("Gestión de proyectos");
    await user.click(checkboxOption);

    const submitBtn = screen.getByRole("button", { name: /enviar respuestas/i });
    await user.click(submitBtn);

    expect(submitSpy).toHaveBeenCalledWith("survey-123", {
      answers: [
        { questionId: "q-1", optionIds: ["opt-1a"] },
        { questionId: "q-2", optionIds: ["opt-2b"] },
      ],
    });
  });
});

