import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper";
import { surveyResponseService } from "../services/survey-response.service";
import { SurveyResponseView } from "./survey-response-view";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function renderView(surveyId = "employability-2026") {
  const { wrapper } = createQueryWrapper();
  return render(<SurveyResponseView surveyId={surveyId} />, { wrapper });
}

describe("SurveyResponseView", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("muestra el título de la encuesta y sus preguntas numeradas", async () => {
    renderView();

    expect(await screen.findByRole("heading", { level: 1, name: "Encuesta de empleabilidad" })).toBeInTheDocument();
    expect(screen.getAllByRole("group")).toHaveLength(6);
    expect(screen.getByRole("radio", { name: "Empleado en el sector privado" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finalizar y Enviar" })).toBeInTheDocument();
  });

  it("marca las preguntas obligatorias sin responder al enviar", async () => {
    renderView();

    await userEvent.click(await screen.findByRole("button", { name: "Finalizar y Enviar" }));

    expect(screen.getAllByText("Esta pregunta es obligatoria.")).toHaveLength(6);
    expect(push).not.toHaveBeenCalled();
  });

  it("envía la encuesta cuando todas las preguntas tienen respuesta", async () => {
    const submit = vi.spyOn(surveyResponseService, "submitAnswers");
    renderView("graduate-follow-up");

    await userEvent.click(await screen.findByRole("checkbox", { name: "Maestría" }));
    await userEvent.click(screen.getByRole("radio", { name: "Sí" }));
    await userEvent.click(screen.getByRole("button", { name: "Finalizar y Enviar" }));

    expect(submit).toHaveBeenCalledWith("graduate-follow-up", { q1: ["q1-o2"], q2: ["q2-o1"] });
    expect(push).toHaveBeenCalledWith("/surveys");
  });

  it("avisa cuando la encuesta no existe", async () => {
    renderView("no-existe");

    expect(await screen.findByRole("heading", { name: "Encuesta no encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a mis encuestas" })).toHaveAttribute("href", "/surveys");
  });
});
