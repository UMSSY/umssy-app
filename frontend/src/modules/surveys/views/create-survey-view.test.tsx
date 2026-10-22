import { AxiosError } from "axios";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { resetSurveyTables } from "../mocks/survey-store.mock";
import { surveysService } from "../services/surveys.service";
import { readSurveyFormDraft, writeSurveyFormDraft } from "../utils/survey-form-draft-storage";
import { CreateSurveyView } from "./create-survey-view";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderForm(resume = false) {
  renderWithQuery(<CreateSurveyView resume={resume} />);
}

function type(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } });
}

// Hay dos botones "Añadir pregunta": el de la barra flotante y el de debajo del formulario.
function addQuestionButton() {
  return screen.getAllByRole("button", { name: "Añadir pregunta" }).at(-1) as HTMLElement;
}

function fillValidSurvey() {
  type(screen.getByPlaceholderText("Título de la encuesta"), "Encuesta de Egresados");
  type(screen.getByLabelText(/^Gestión/), "II-2026");
  type(screen.getByLabelText(/^Apertura/), "2099-11-03");
  type(screen.getByLabelText(/^Cierre/), "2099-12-15");
  type(screen.getByLabelText("Enunciado de la pregunta 1"), "¿Cuál es tu condición laboral?");
}

describe("CreateSurveyView", () => {
  beforeEach(() => {
    localStorage.clear();
    resetSurveyTables();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe("estructura del formulario", () => {
    it("muestra el formulario en estado Borrador con sus campos y botones", () => {
      renderForm();

      expect(screen.getByRole("heading", { name: "Crear encuesta" })).toBeDefined();
      expect(screen.getByText("Borrador")).toBeDefined();
      ["Cancelar", "Vista previa", "Guardar borrador", "Publicar encuesta"].forEach((name) =>
        expect(screen.getByRole("button", { name })).toBeDefined(),
      );
      ["Carrera dirigida", "Gestión", "Apertura", "Cierre"].forEach((label) => expect(screen.getByLabelText(new RegExp(`^${label}`))).toBeDefined());
      expect(screen.getByPlaceholderText("Descripción de la encuesta")).toBeDefined();
    });

    it("la primera pregunta viene vacía, de opción única, con dos opciones y obligatoria", () => {
      renderForm();

      expect(screen.getByLabelText("Enunciado de la pregunta 1").getAttribute("placeholder")).toBe("1. Pregunta sin título");
      expect(screen.getByRole("combobox", { name: "Tipo de la pregunta 1" }).textContent).toContain("Opción única");
      expect((screen.getByLabelText("Opción 1 de la pregunta 1") as HTMLInputElement).value).toBe("Opción 1");
      expect((screen.getByLabelText("Opción 2 de la pregunta 1") as HTMLInputElement).value).toBe("Opción 2");
      expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
    });

    it("limita el largo de los textos", () => {
      renderForm();

      expect(screen.getByPlaceholderText("Título de la encuesta").getAttribute("maxlength")).toBe("120");
      expect(screen.getByPlaceholderText("Descripción de la encuesta").getAttribute("maxlength")).toBe("500");
      expect(screen.getByLabelText("Enunciado de la pregunta 1").getAttribute("maxlength")).toBe("200");
      expect(screen.getByLabelText("Opción 1 de la pregunta 1").getAttribute("maxlength")).toBe("100");
    });
  });

  describe("edición de preguntas", () => {
    it("añade preguntas numeradas debajo de la activa y condensa las demás", () => {
      renderForm();
      type(screen.getByLabelText("Enunciado de la pregunta 1"), "¿Trabajas?");

      fireEvent.click(addQuestionButton());

      expect(screen.getByLabelText("Enunciado de la pregunta 2")).toBeDefined();
      const condensed = screen.getByRole("button", { name: "Editar pregunta 1" });
      expect(condensed.textContent).toContain("1. ¿Trabajas?");
      expect(condensed.textContent).toContain("Opción única");
      expect(condensed.textContent).toContain("2 opciones");
      expect(within(condensed).getByLabelText("Obligatoria")).toBeDefined();
    });

    it("al hacer clic en una pregunta condensada la vuelve a editar", () => {
      renderForm();
      fireEvent.click(addQuestionButton());

      fireEvent.click(screen.getByRole("button", { name: "Editar pregunta 1" }));

      expect(screen.getByLabelText("Enunciado de la pregunta 1")).toBeDefined();
      expect(screen.getByRole("button", { name: "Editar pregunta 2" })).toBeDefined();
    });

    it("lista solo los tres tipos de pregunta y conserva las opciones al cambiarlo", async () => {
      const user = userEvent.setup();
      renderForm();
      type(screen.getByLabelText("Opción 1 de la pregunta 1"), "Sí");

      await user.click(screen.getByRole("combobox", { name: "Tipo de la pregunta 1" }));
      const options = within(await screen.findByRole("listbox")).getAllByRole("option");
      expect(options.map((option) => option.textContent)).toEqual(["Opción única", "Opción múltiple", "Lista desplegable"]);
      await user.click(screen.getByRole("option", { name: "Lista desplegable" }));

      await waitFor(() => expect(screen.getByRole("combobox", { name: "Tipo de la pregunta 1" }).textContent).toContain("Lista desplegable"));
      expect((screen.getByLabelText("Opción 1 de la pregunta 1") as HTMLInputElement).value).toBe("Sí");
    });

    it("añade una opción al final y le pasa el foco", () => {
      renderForm();

      fireEvent.click(screen.getByRole("button", { name: "Añadir opción" }));

      const newOption = screen.getByLabelText("Opción 3 de la pregunta 1");
      expect((newOption as HTMLInputElement).value).toBe("Opción 3");
      expect(document.activeElement).toBe(newOption);
    });

    it("oculta la X con dos opciones y al eliminar una reordena el resto", () => {
      renderForm();
      expect(screen.queryByRole("button", { name: /Eliminar opción/ })).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Añadir opción" }));
      type(screen.getByLabelText("Opción 3 de la pregunta 1"), "Tercera");

      fireEvent.click(screen.getByRole("button", { name: "Eliminar opción 2" }));

      expect((screen.getByLabelText("Opción 2 de la pregunta 1") as HTMLInputElement).value).toBe("Tercera");
      expect(screen.queryByRole("button", { name: /Eliminar opción/ })).toBeNull();
    });

    it("duplica y elimina preguntas desde la tarjeta y la barra flotante", () => {
      renderForm();
      expect(screen.getByRole("button", { name: "Eliminar pregunta 1" }).hasAttribute("disabled")).toBe(true);

      fireEvent.click(within(screen.getByRole("toolbar")).getByRole("button", { name: "Duplicar pregunta" }));
      expect(screen.getByLabelText("Enunciado de la pregunta 2")).toBeDefined();

      fireEvent.click(screen.getByRole("button", { name: "Eliminar pregunta 2" }));
      expect(screen.queryByLabelText("Enunciado de la pregunta 2")).toBeNull();
    });

    it("cambia si la pregunta es obligatoria", () => {
      renderForm();

      fireEvent.click(screen.getByRole("switch"));

      expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("false");
    });

    it("muestra la vista previa como la verá el titulado", () => {
      renderForm();
      type(screen.getByPlaceholderText("Título de la encuesta"), "Mi encuesta");
      type(screen.getByLabelText("Enunciado de la pregunta 1"), "¿Trabajas?");

      fireEvent.click(screen.getByRole("button", { name: "Vista previa" }));

      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText("Mi encuesta")).toBeDefined();
      expect(within(dialog).getByText(/1\. ¿Trabajas\?/)).toBeDefined();
      expect(within(dialog).getByText("Opción 1")).toBeDefined();
    });
  });

  describe("validaciones", () => {
    it("al publicar con campos vacíos lista los errores en un banner, los marca en cada campo y no abre el modal", () => {
      renderForm();

      fireEvent.click(screen.getByRole("button", { name: "Publicar encuesta" }));

      const banner = screen.getByRole("alert");
      expect(banner.textContent).toContain("Complete los campos obligatorios antes de publicar");
      expect(banner.textContent).toContain("Pregunta 1: el enunciado de la pregunta es obligatorio.");
      expect(screen.getByText("El enunciado de la pregunta es obligatorio")).toBeDefined();
      expect(screen.getByText("El título de la encuesta es obligatorio")).toBeDefined();
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });

    it("los errores desaparecen apenas se corrigen", () => {
      renderForm();
      fireEvent.click(screen.getByRole("button", { name: "Publicar encuesta" }));

      type(screen.getByPlaceholderText("Título de la encuesta"), "Encuesta");

      expect(screen.queryByText("El título de la encuesta es obligatorio")).toBeNull();
    });

    it("no guarda si la fecha de cierre es anterior a la de apertura", () => {
      const create = vi.spyOn(surveysService, "createSurvey");
      renderForm();
      type(screen.getByPlaceholderText("Título de la encuesta"), "Encuesta");
      type(screen.getByLabelText(/^Apertura/), "2099-12-01");
      type(screen.getByLabelText(/^Cierre/), "2099-11-01");

      fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

      expect(screen.getByText("La fecha de cierre debe ser posterior a la fecha de apertura")).toBeDefined();
      expect(create).not.toHaveBeenCalled();
    });

    it("marca las opciones vacías de una pregunta", () => {
      renderForm();
      fillValidSurvey();
      type(screen.getByLabelText("Opción 2 de la pregunta 1"), " ");

      fireEvent.click(screen.getByRole("button", { name: "Publicar encuesta" }));

      expect(screen.getByText("Las opciones no pueden estar vacías")).toBeDefined();
    });
  });

  describe("publicar", () => {
    it("pide confirmación con el resumen y al publicar avisa y vuelve al historial", async () => {
      renderForm();
      fillValidSurvey();

      fireEvent.click(screen.getByRole("button", { name: "Publicar encuesta" }));
      const dialog = screen.getByRole("alertdialog");
      expect(within(dialog).getByText("¿Publicar encuesta?")).toBeDefined();
      ["Encuesta de Egresados", "Licenciatura en Ingeniería de Sistemas", "03/11/2099 - 15/12/2099", "1 (1 obligatoria)"].forEach((text) =>
        expect(within(dialog).getByText(text)).toBeDefined(),
      );

      fireEvent.click(within(dialog).getByRole("button", { name: "Publicar" }));

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Encuesta creada con éxito", expect.any(Object)));
      expect(router.push).toHaveBeenCalledWith("/backoffice/surveys");
      const list = await surveysService.getSurveys({ page: 1, limit: 1 });
      expect(list.data.items[0]).toMatchObject({ title: "Encuesta de Egresados", status: "PUBLISHED" });
      expect(readSurveyFormDraft()).toBeNull();
    });

    it("ante un error de red avisa, conserva los datos y vuelve a habilitar los botones", async () => {
      vi.spyOn(surveysService, "createSurvey").mockRejectedValue(new AxiosError("Network Error", "ERR_NETWORK"));
      renderForm();
      fillValidSurvey();
      fireEvent.click(screen.getByRole("button", { name: "Publicar encuesta" }));

      fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Publicar" }));

      await waitFor(() => expect(screen.getByText("Error 503/504: Sin conexión con el servidor")).toBeDefined());
      expect(toast.error).toHaveBeenCalledWith("Error 503/504: Sin conexión con el servidor", expect.any(Object));
      expect((screen.getByPlaceholderText("Título de la encuesta") as HTMLInputElement).value).toBe("Encuesta de Egresados");
      expect(screen.getByRole("button", { name: "Publicar encuesta" }).hasAttribute("disabled")).toBe(false);
      expect(router.push).not.toHaveBeenCalled();
    });

    it("deshabilita los botones de envío mientras espera al servidor", async () => {
      vi.spyOn(surveysService, "createSurvey").mockReturnValue(new Promise(() => {}));
      renderForm();
      type(screen.getByPlaceholderText("Título de la encuesta"), "Encuesta");

      fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

      await waitFor(() => expect(screen.getByRole("button", { name: "Guardar borrador" }).hasAttribute("disabled")).toBe(true));
      expect(screen.getByRole("button", { name: "Publicar encuesta" }).hasAttribute("disabled")).toBe(true);
    });
  });

  describe("borradores", () => {
    it("guarda el borrador y pasa a la ruta de edición", async () => {
      renderForm();
      type(screen.getByPlaceholderText("Título de la encuesta"), "Encuesta en borrador");

      fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Borrador guardado", expect.any(Object)));
      expect(router.replace).toHaveBeenCalledWith(expect.stringMatching(/^\/backoffice\/surveys\/.+\/edit$/));
    });

    it("guarda el avance en el navegador mientras se escribe", async () => {
      renderForm();

      type(screen.getByPlaceholderText("Título de la encuesta"), "Avance sin conexión");

      await waitFor(() => expect(readSurveyFormDraft()?.values.title).toBe("Avance sin conexión"), { timeout: 2000 });
      expect(readSurveyFormDraft()?.surveyId).toBeNull();
    });

    it("no guarda nada en el navegador si no se escribió", async () => {
      renderForm();

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(readSurveyFormDraft()).toBeNull();
    });

    it("al retomar carga los datos guardados en el navegador", () => {
      writeSurveyFormDraft(null, {
        title: "Encuesta retomada",
        description: "",
        targetCareer: null,
        period: "II-2026",
        opensAt: "",
        closesAt: "",
        questions: [{ text: "¿Sigues trabajando?", type: "MULTIPLE_CHOICE", isRequired: false, options: ["A", "B"] }],
      });

      renderForm(true);

      expect((screen.getByPlaceholderText("Título de la encuesta") as HTMLInputElement).value).toBe("Encuesta retomada");
      expect((screen.getByLabelText("Enunciado de la pregunta 1") as HTMLInputElement).value).toBe("¿Sigues trabajando?");
      expect((screen.getByLabelText(/^Carrera dirigida/) as HTMLSelectElement).value).toBe("ALL");
    });

    it("sin la opción de retomar empieza vacío aunque haya un avance guardado", () => {
      writeSurveyFormDraft(null, { title: "Viejo", description: "", targetCareer: null, period: null, opensAt: "", closesAt: "", questions: [] });

      renderForm();

      expect((screen.getByPlaceholderText("Título de la encuesta") as HTMLInputElement).value).toBe("");
    });
  });

  describe("cancelar", () => {
    it("sin cambios vuelve directo al historial", () => {
      renderForm();

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(router.push).toHaveBeenCalledWith("/backoffice/surveys");
    });

    it("con cambios pide confirmación antes de salir", () => {
      renderForm();
      type(screen.getByPlaceholderText("Título de la encuesta"), "Cambio");

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      const dialog = screen.getByRole("alertdialog");
      expect(within(dialog).getByText("¿Salir sin guardar?")).toBeDefined();
      expect(router.push).not.toHaveBeenCalled();

      fireEvent.click(within(dialog).getByRole("button", { name: "Salir" }));
      expect(router.push).toHaveBeenCalledWith("/backoffice/surveys");
    });
  });
});
