import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { resetSurveyTables } from "../mocks/survey-store.mock";
import { surveysService } from "../services/surveys.service";
import { writeSurveyFormDraft } from "../utils/survey-form-draft-storage";
import { SurveysView } from "./surveys-view";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const FIRST_PAGE = "Mostrando 1-10 de 25 encuestas";

function getBodyRows() {
  return screen.getAllByRole("row").slice(1);
}

async function renderLoaded() {
  renderWithQuery(<SurveysView />);
  await waitFor(() => expect(screen.getByText(FIRST_PAGE)).toBeDefined());
}

describe("SurveysView", () => {
  beforeEach(() => {
    localStorage.clear();
    resetSurveyTables();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("muestra el historial con sus controles y la primera página de encuestas", async () => {
    await renderLoaded();

    expect(screen.getByRole("heading", { name: "Historial de Encuestas" })).toBeDefined();
    expect(screen.getByPlaceholderText("Buscar por correo electrónico del administrador...")).toBeDefined();
    expect(screen.getByRole("combobox", { name: "Gestión académica" }).textContent).toContain("Todos");
    expect(screen.getByRole("button", { name: "Actualizar" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Crear encuesta" }).getAttribute("href")).toBe("/backoffice/surveys/create");
    expect(getBodyRows()).toHaveLength(10);
  });

  it("cambia de página", async () => {
    const spy = vi.spyOn(surveysService, "getSurveys");
    await renderLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));

    await waitFor(() => expect(screen.getByText("Mostrando 11-20 de 25 encuestas")).toBeDefined());
    expect(spy).toHaveBeenLastCalledWith({ page: 2, limit: 10, period: undefined, search: "" });
  });

  it("cambia la cantidad de filas por página y vuelve a la primera", async () => {
    await renderLoaded();
    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
    await waitFor(() => expect(screen.getByText("Mostrando 11-20 de 25 encuestas")).toBeDefined());

    fireEvent.change(screen.getByLabelText("Filas por página"), { target: { value: "20" } });

    await waitFor(() => expect(screen.getByText("Mostrando 1-20 de 25 encuestas")).toBeDefined());
    expect(getBodyRows()).toHaveLength(20);
  });

  it("filtra por gestión y vuelve a la primera página", async () => {
    const spy = vi.spyOn(surveysService, "getSurveys");
    const user = userEvent.setup();
    await renderLoaded();
    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
    await waitFor(() => expect(screen.getByText("Mostrando 11-20 de 25 encuestas")).toBeDefined());

    await user.click(screen.getByRole("combobox", { name: "Gestión académica" }));
    await user.click(await screen.findByRole("option", { name: "I-2025" }));

    await waitFor(() => expect(spy).toHaveBeenLastCalledWith({ page: 1, limit: 10, period: "I-2025", search: "" }));
    await waitFor(() => expect(getBodyRows().every((row) => row.textContent?.includes("I-2025"))).toBe(true));
  });

  it("busca por correo del administrador", async () => {
    const spy = vi.spyOn(surveysService, "getSurveys");
    await renderLoaded();

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar por correo electrónico" }), {
      target: { value: "carla" },
    });

    await waitFor(() => expect(spy).toHaveBeenLastCalledWith({ page: 1, limit: 10, period: undefined, search: "carla" }));
    await waitFor(() => expect(getBodyRows().every((row) => row.textContent?.includes("carla.arce@umssy.edu"))).toBe(true));
  });

  it("vuelve a pedir la lista al presionar Actualizar", async () => {
    const spy = vi.spyOn(surveysService, "getSurveys");
    await renderLoaded();
    const callsBefore = spy.mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));

    await waitFor(() => expect(spy.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it("desactiva una encuesta activa con el toggle y avisa con un toast", async () => {
    await renderLoaded();
    const activeToggles = screen.getAllByRole("switch", { name: "Activa" });
    const [activeToggle] = activeToggles;

    fireEvent.click(activeToggle);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("La encuesta ahora está inactiva", expect.any(Object)));
    await waitFor(() => expect(screen.getAllByRole("switch", { name: "Activa" }).length).toBe(activeToggles.length - 1));
  });

  it("avisa si no se pudo cambiar el estado", async () => {
    vi.spyOn(surveysService, "changeSurveyStatus").mockRejectedValue(new Error("Network error"));
    await renderLoaded();

    fireEvent.click(screen.getAllByRole("switch", { name: "Activa" })[0]);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("No se pudo cambiar el estado de la encuesta.", expect.any(Object)),
    );
  });

  it("muestra un mensaje de error si falla la carga", async () => {
    vi.spyOn(surveysService, "getSurveys").mockRejectedValue(new Error("Network error"));

    renderWithQuery(<SurveysView />);

    await waitFor(() => expect(screen.getByText("No se pudieron cargar las encuestas.")).toBeDefined());
  });

  describe("encuesta sin publicar guardada en el navegador", () => {
    const values = {
      title: "Encuesta a medias",
      description: "",
      targetCareer: null,
      period: null,
      opensAt: "",
      closesAt: "",
      questions: [],
    };

    it("no muestra la opción de retomar si no hay nada guardado", async () => {
      await renderLoaded();

      expect(screen.queryByRole("link", { name: "Retomar encuesta" })).toBeNull();
    });

    it("ofrece retomar una encuesta nueva guardada", async () => {
      writeSurveyFormDraft(null, values);
      await renderLoaded();

      expect(screen.getByText("Encuesta a medias")).toBeDefined();
      expect(screen.getByRole("link", { name: "Retomar encuesta" }).getAttribute("href")).toBe("/backoffice/surveys/create?resume=1");
    });

    it("retoma la edición de un borrador existente", async () => {
      writeSurveyFormDraft("srv-02", { ...values, title: "" });
      await renderLoaded();

      expect(screen.getByText("Encuesta sin título")).toBeDefined();
      expect(screen.getByRole("link", { name: "Retomar encuesta" }).getAttribute("href")).toBe("/backoffice/surveys/srv-02/edit?resume=1");
    });

    it("oculta la opción al descartar la encuesta guardada", async () => {
      writeSurveyFormDraft(null, values);
      await renderLoaded();

      fireEvent.click(screen.getByRole("button", { name: "Descartar" }));

      await waitFor(() => expect(screen.queryByRole("link", { name: "Retomar encuesta" })).toBeNull());
      expect(localStorage.getItem("umssy.surveys.form-draft")).toBeNull();
    });
  });
});
