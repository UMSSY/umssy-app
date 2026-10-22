import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { resetSurveyTables } from "../mocks/survey-store.mock";
import { surveysService } from "../services/surveys.service";
import { writeSurveyFormDraft } from "../utils/survey-form-draft-storage";
import { EditSurveyView } from "./edit-survey-view";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function titleInput() {
  return screen.findByPlaceholderText("Título de la encuesta") as Promise<HTMLInputElement>;
}

describe("EditSurveyView", () => {
  beforeEach(() => {
    localStorage.clear();
    resetSurveyTables();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("carga el borrador guardado con sus preguntas", async () => {
    renderWithQuery(<EditSurveyView id="srv-02" />);

    expect((await titleInput()).value).toBe("Seguimiento Laboral - Ingeniería");
    expect(screen.getByRole("heading", { name: "Editar encuesta" })).toBeDefined();
    expect((screen.getByLabelText("Enunciado de la pregunta 1") as HTMLInputElement).value).toBe(
      "¿Qué tan satisfecho estás con la formación recibida?",
    );
  });

  it("guarda los cambios sobre el mismo borrador sin cambiar de ruta", async () => {
    renderWithQuery(<EditSurveyView id="srv-02" />);
    fireEvent.change(await titleInput(), { target: { value: "Título nuevo" } });

    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Borrador guardado", expect.any(Object)));
    expect(router.replace).not.toHaveBeenCalled();
    expect((await surveysService.getSurvey("srv-02")).data.title).toBe("Título nuevo");
  });

  it("al retomar usa el avance guardado en el navegador para ese borrador", async () => {
    writeSurveyFormDraft("srv-02", {
      title: "Avance local",
      description: "",
      targetCareer: null,
      period: null,
      opensAt: "",
      closesAt: "",
      questions: [],
    });

    renderWithQuery(<EditSurveyView id="srv-02" resume />);

    expect((await titleInput()).value).toBe("Avance local");
  });

  it("ignora el avance local de otra encuesta", async () => {
    writeSurveyFormDraft("srv-05", {
      title: "De otra encuesta",
      description: "",
      targetCareer: null,
      period: null,
      opensAt: "",
      closesAt: "",
      questions: [],
    });

    renderWithQuery(<EditSurveyView id="srv-02" resume />);

    expect((await titleInput()).value).toBe("Seguimiento Laboral - Ingeniería");
  });

  it("no permite editar una encuesta publicada", async () => {
    renderWithQuery(<EditSurveyView id="srv-01" />);

    expect(await screen.findByText("Esta encuesta ya fue publicada y no se puede editar.")).toBeDefined();
    expect(screen.getByRole("link", { name: "Volver al historial" }).getAttribute("href")).toBe("/backoffice/surveys");
  });

  it("avisa si la encuesta no se pudo cargar", async () => {
    renderWithQuery(<EditSurveyView id="no-existe" />);

    expect(await screen.findByText("No se pudo cargar la encuesta.")).toBeDefined();
  });
});
