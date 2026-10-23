import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { surveysService } from "../services/surveys.service";
import { apiResponse, buildAxiosError, CAREERS, CREATED_SURVEY, FIXED_NOW } from "../testing/survey-fixtures";
import { CreateSurveyView } from "./create-survey-view";

const push = vi.fn();
const VIEW_TEST_TIMEOUT_MS = 20_000;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/backoffice/surveys/create",
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderView() {
  const user = userEvent.setup({ delay: null });
  renderWithQuery(<CreateSurveyView />);
  return user;
}

async function selectOption(user: ReturnType<typeof userEvent.setup>, comboboxName: string, optionName: string) {
  await user.click(screen.getByRole("combobox", { name: comboboxName }));
  await user.click(await screen.findByRole("option", { name: optionName }));
}

async function pickDate(user: ReturnType<typeof userEvent.setup>, fieldLabel: RegExp, day: RegExp) {
  await user.click(screen.getByRole("button", { name: fieldLabel }));
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: day }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

async function fillValidSurvey(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Título"), "Encuesta de Empleabilidad");
  await selectOption(user, "Carrera dirigida", CAREERS[0].title);
  await selectOption(user, "Gestión", "II-2026");
  await pickDate(user, /^Apertura/, /24 de octubre/i);
  await pickDate(user, /^Cierre/, /27 de octubre/i);
  await user.type(screen.getByLabelText("Enunciado de la pregunta 1"), "¿Trabajas actualmente?");
  await user.type(screen.getByLabelText("Texto de la opción 1"), "Sí");
  await user.type(screen.getByLabelText("Texto de la opción 2"), "No");
}

describe("CreateSurveyView", { timeout: VIEW_TEST_TIMEOUT_MS }, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_NOW);
    vi.spyOn(surveysService, "listCareers").mockResolvedValue(apiResponse(CAREERS));
    vi.spyOn(surveysService, "createSurvey").mockResolvedValue(apiResponse(CREATED_SURVEY, 201));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    push.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it("CA1: muestra el formulario en borrador con encabezado, una pregunta vacía y las acciones", () => {
    renderView();

    expect(screen.getByRole("heading", { name: /Crear encuesta/ })).toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveAttribute("aria-required", "true");
    expect(screen.getByLabelText("Descripción")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Carrera dirigida" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Gestión" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Apertura/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Cierre/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Enunciado de la pregunta 1")).toHaveValue("");
    expect(screen.getByLabelText("Enunciado de la pregunta 1")).toHaveAttribute("placeholder", "Pregunta sin título");
    for (const name of ["Cancelar", "Vista previa", "Guardar borrador", "Publicar encuesta"]) {
      expect(screen.getByText(name, { selector: "button" })).toBeInTheDocument();
    }
    expect(screen.getAllByText("*").length).toBeGreaterThanOrEqual(5);
  });

  it("CA2: añade una pregunta numerada, de opción única, obligatoria y con el foco en el enunciado", async () => {
    const user = renderView();

    await user.click(screen.getByText("Añadir pregunta", { selector: "button" }));

    const statement = screen.getByLabelText("Enunciado de la pregunta 2");
    await waitFor(() => expect(statement).toHaveFocus());
    expect(statement).toHaveAttribute("placeholder", "Pregunta sin título");
    expect(screen.getByRole("combobox", { name: "Tipo de pregunta" })).toHaveTextContent("Opción única");
    expect(screen.getByLabelText("Texto de la opción 1")).toHaveAttribute("placeholder", "Opción 1");
    expect(screen.getByLabelText("Texto de la opción 2")).toHaveAttribute("placeholder", "Opción 2");
    expect(screen.getByRole("switch", { name: "Obligatoria" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Editar pregunta 1" })).toBeInTheDocument();
  });

  it("CA2: el botón + de la barra flotante inserta la pregunta debajo de la activa", async () => {
    const user = renderView();
    await user.type(screen.getByLabelText("Enunciado de la pregunta 1"), "Primera");
    await user.click(screen.getByText("Añadir pregunta", { selector: "button" }));
    await user.type(screen.getByLabelText("Enunciado de la pregunta 2"), "Segunda");

    await user.click(screen.getByRole("button", { name: "Editar pregunta 1" }));
    const toolbar = screen.getByRole("toolbar", { name: "Acciones de la pregunta" });
    await user.click(within(toolbar).getByRole("button", { name: "Añadir pregunta" }));

    expect(screen.getByLabelText("Enunciado de la pregunta 2")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Editar pregunta 3" })).toHaveTextContent("Segunda");
  });

  it("CA5: activa la tarjeta al hacer clic y resume las demás", async () => {
    const user = renderView();
    await user.type(screen.getByLabelText("Enunciado de la pregunta 1"), "Primera");
    await user.click(screen.getByText("Añadir pregunta", { selector: "button" }));

    const summary = screen.getByRole("button", { name: "Editar pregunta 1" });
    expect(summary).toHaveTextContent("1. Primera*");
    expect(summary).toHaveTextContent("Opción única");
    expect(summary).toHaveTextContent("2 opciones");

    await user.click(summary);

    expect(screen.getByLabelText("Enunciado de la pregunta 1")).toHaveValue("Primera");
    expect(screen.getByRole("button", { name: "Editar pregunta 2" })).toBeInTheDocument();
  });

  it("CA5: duplica, elimina y reordena con teclado actualizando la numeración", async () => {
    const user = renderView();
    await user.type(screen.getByLabelText("Enunciado de la pregunta 1"), "Primera");

    await user.click(screen.getAllByRole("button", { name: "Duplicar pregunta" })[0]);
    expect(screen.getByLabelText("Enunciado de la pregunta 2")).toHaveValue("Primera");

    await user.clear(screen.getByLabelText("Enunciado de la pregunta 2"));
    await user.type(screen.getByLabelText("Enunciado de la pregunta 2"), "Segunda");
    screen.getByRole("button", { name: /^Reordenar pregunta 2/ }).focus();
    await user.keyboard("{ArrowUp}");

    expect(screen.getByLabelText("Enunciado de la pregunta 1")).toHaveValue("Segunda");
    expect(screen.getByRole("button", { name: "Editar pregunta 2" })).toHaveTextContent("Primera");

    await user.click(screen.getByRole("button", { name: "Eliminar pregunta" }));
    expect(screen.getByLabelText("Enunciado de la pregunta 1")).toHaveValue("Primera");
    expect(screen.queryByLabelText("Enunciado de la pregunta 2")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar pregunta 2" })).not.toBeInTheDocument();
  });

  it("CA5: reordena arrastrando la tarjeta desde su manejador", async () => {
    const user = renderView();
    await user.type(screen.getByLabelText("Enunciado de la pregunta 1"), "Primera");
    await user.click(screen.getByText("Añadir pregunta", { selector: "button" }));
    await user.type(screen.getByLabelText("Enunciado de la pregunta 2"), "Segunda");

    const firstCard = screen.getByTestId("question-card-1");
    const secondCard = screen.getByTestId("question-card-2");
    const dataTransfer = { effectAllowed: "", setData: vi.fn() };
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.pointerDown(within(secondCard).getByRole("button", { name: /^Reordenar/ }));
    fireEvent.dragStart(secondCard, { dataTransfer });
    fireEvent.dragEnter(firstCard, { dataTransfer });
    fireEvent.dragOver(firstCard, { dataTransfer });
    fireEvent.drop(firstCard, { dataTransfer });
    fireEvent.dragEnd(secondCard, { dataTransfer });

    expect(screen.getByLabelText("Enunciado de la pregunta 1")).toHaveValue("Segunda");
    expect(screen.getByRole("button", { name: "Editar pregunta 2" })).toHaveTextContent("Primera");
  });

  it("CA4: añade opciones con foco, las quita y oculta la X con solo 2 opciones", async () => {
    const user = renderView();

    expect(screen.queryByRole("button", { name: /^Eliminar opción/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Añadir opción" }));

    const third = screen.getByLabelText("Texto de la opción 3");
    await waitFor(() => expect(third).toHaveFocus());
    expect(third).toHaveAttribute("placeholder", "Opción 3");
    await user.type(third, "Tercera");

    await user.click(screen.getByRole("button", { name: "Eliminar opción 1" }));

    expect(screen.getByLabelText("Texto de la opción 2")).toHaveValue("Tercera");
    expect(screen.queryByLabelText("Texto de la opción 3")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Eliminar opción/ })).not.toBeInTheDocument();
  });

  it("CA3: ofrece solo preguntas cerradas y conserva las opciones al cambiar de tipo", async () => {
    const user = renderView();
    await user.type(screen.getByLabelText("Texto de la opción 1"), "Sí");

    await user.click(screen.getByRole("combobox", { name: "Tipo de pregunta" }));
    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(["Opción única", "Opción múltiple"]);
    await user.click(screen.getByRole("option", { name: "Opción múltiple" }));

    expect(screen.getByLabelText("Texto de la opción 1")).toHaveValue("Sí");
    expect(document.querySelector('[data-marker="square"]')).not.toBeNull();
    expect(document.querySelector('[data-marker="circle"]')).toBeNull();

    await selectOption(user, "Tipo de pregunta", "Opción única");
    expect(screen.getByLabelText("Texto de la opción 1")).toHaveValue("Sí");
    expect(document.querySelector('[data-marker="circle"]')).not.toBeNull();
  });

  it("CA10: limita la longitud de los campos de texto", async () => {
    const user = renderView();

    expect(screen.getByLabelText("Título")).toHaveAttribute("maxLength", "150");
    expect(screen.getByLabelText("Descripción")).toHaveAttribute("maxLength", "500");
    expect(screen.getByLabelText("Enunciado de la pregunta 1")).toHaveAttribute("maxLength", "250");
    expect(screen.getByLabelText("Texto de la opción 1")).toHaveAttribute("maxLength", "100");

    await user.type(screen.getByLabelText("Título"), "    ");
    await user.click(screen.getByRole("button", { name: /Guardar borrador/ }));

    expect(toast.error).toHaveBeenCalledWith(SURVEY_MESSAGES.draftNeedsTitle, expect.anything());
    expect(screen.getByText(SURVEY_MESSAGES.titleRequired)).toBeInTheDocument();
    expect(surveysService.createSurvey).not.toHaveBeenCalled();
  });

  it("CA7: no publica con campos vacíos, lista los errores y resalta cada campo", async () => {
    const user = renderView();

    await user.click(screen.getByRole("button", { name: /Publicar encuesta/ }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(SURVEY_MESSAGES.validationAlertTitle);
    expect(alert).toHaveTextContent("Título: es obligatorio.");
    expect(alert).toHaveTextContent("Carrera dirigida: es obligatoria.");
    expect(alert).toHaveTextContent("Pregunta 1: el enunciado es obligatorio.");
    expect(alert).toHaveTextContent("Pregunta 1: debe tener al menos 2 opciones.");
    expect(screen.getByLabelText("Título")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("combobox", { name: "Carrera dirigida" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(SURVEY_MESSAGES.opensAtRequired)).toBeInTheDocument();
    expect(screen.getByTestId("question-card-1").querySelector('[data-invalid="true"]')).not.toBeNull();
    await waitFor(() => expect(screen.getByLabelText("Título")).toHaveFocus());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(surveysService.createSurvey).not.toHaveBeenCalled();
  });

  it("CA7: los errores desaparecen al corregir los campos", async () => {
    const user = renderView();
    await user.click(screen.getByRole("button", { name: /Publicar encuesta/ }));

    await user.type(screen.getByLabelText("Título"), "Encuesta válida");

    expect(screen.getByRole("alert")).not.toHaveTextContent("Título:");
    expect(screen.getByLabelText("Título")).not.toHaveAttribute("aria-invalid");
  });

  it("CA8: rechaza opciones repetidas sin distinguir mayúsculas ni espacios", async () => {
    const user = renderView();
    await fillValidSurvey(user);
    await user.clear(screen.getByLabelText("Texto de la opción 2"));
    await user.type(screen.getByLabelText("Texto de la opción 2"), "  SÍ ");

    await user.click(screen.getByRole("button", { name: /Publicar encuesta/ }));

    expect(screen.getByText(SURVEY_MESSAGES.optionsDuplicated)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Pregunta 1: las opciones no pueden repetirse.");
    expect(surveysService.createSurvey).not.toHaveBeenCalled();
  });

  it("CA9: rechaza una fecha de cierre igual o anterior a la apertura", async () => {
    const user = renderView();
    await fillValidSurvey(user);
    await pickDate(user, /^Cierre/, /24 de octubre/i);

    await user.click(screen.getByRole("button", { name: /Publicar encuesta/ }));

    expect(screen.getByText(SURVEY_MESSAGES.closesBeforeOpens)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Fecha de cierre: debe ser posterior a la fecha de apertura.");
  });

  it("CA9: no permite elegir una apertura anterior a hoy en el calendario", async () => {
    const user = renderView();

    await user.click(screen.getByRole("button", { name: /^Apertura/ }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("button", { name: /21 de octubre/i })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: /22 de octubre/i })).toBeEnabled();
  });

  it("CA6: confirma en el diálogo, publica y redirige al listado", async () => {
    const user = renderView();
    await fillValidSurvey(user);
    await user.click(screen.getByText("Añadir pregunta", { selector: "button" }));
    await user.type(screen.getByLabelText("Enunciado de la pregunta 2"), "Beneficios");
    await user.type(screen.getByLabelText("Texto de la opción 1"), "Seguro");
    await user.type(screen.getByLabelText("Texto de la opción 2"), "Bono");
    await user.click(screen.getByRole("switch", { name: "Obligatoria" }));

    await user.click(screen.getByRole("button", { name: /Publicar encuesta/ }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("¿Publicar encuesta?")).toBeInTheDocument();
    expect(dialog).toHaveTextContent(SURVEY_MESSAGES.publishDialogDescription);
    expect(dialog).toHaveTextContent("EncuestaEncuesta de Empleabilidad");
    expect(dialog).toHaveTextContent(`Dirigida a${CAREERS[0].title}`);
    expect(dialog).toHaveTextContent("Vigencia24/10/2026 - 27/10/2026");
    expect(dialog).toHaveTextContent("Preguntas2 (1 obligatoria)");

    await user.click(within(dialog).getByRole("button", { name: "Publicar" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/backoffice/surveys"));
    expect(toast.success).toHaveBeenCalledWith(SURVEY_MESSAGES.publishSuccess, { richColors: true });
    expect(surveysService.createSurvey).toHaveBeenCalledWith({
      title: "Encuesta de Empleabilidad",
      description: undefined,
      careerId: CAREERS[0].id,
      academicPeriod: "II-2026",
      opensAt: "2026-10-24T04:00:00.000Z",
      closesAt: "2026-10-28T03:59:59.999Z",
      status: "published",
      questions: [
        {
          statement: "¿Trabajas actualmente?",
          type: "single_choice",
          isRequired: true,
          options: [{ label: "Sí" }, { label: "No" }],
        },
        {
          statement: "Beneficios",
          type: "single_choice",
          isRequired: false,
          options: [{ label: "Seguro" }, { label: "Bono" }],
        },
      ],
    });
  });

  it("CA14: deshabilita Publicar mientras se envía para evitar duplicados", async () => {
    let resolveRequest: (value: Awaited<ReturnType<typeof surveysService.createSurvey>>) => void = () => undefined;
    vi.mocked(surveysService.createSurvey).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const user = renderView();
    await fillValidSurvey(user);
    await user.click(screen.getByRole("button", { name: /Publicar encuesta/ }));
    const dialog = await screen.findByRole("alertdialog");

    await user.click(within(dialog).getByRole("button", { name: "Publicar" }));

    const busyButton = await within(dialog).findByRole("button", { name: /Publicando/ });
    expect(busyButton).toBeDisabled();
    await user.click(busyButton);
    expect(surveysService.createSurvey).toHaveBeenCalledTimes(1);

    resolveRequest(apiResponse(CREATED_SURVEY, 201));
    await waitFor(() => expect(push).toHaveBeenCalled());
  });

  it("CA14: muestra el error de conexión, conserva los datos y rehabilita el botón", async () => {
    vi.mocked(surveysService.createSurvey).mockRejectedValue(buildAxiosError(undefined));
    const user = renderView();
    await fillValidSurvey(user);
    await user.click(screen.getByRole("button", { name: /Publicar encuesta/ }));
    const dialog = await screen.findByRole("alertdialog");

    await user.click(within(dialog).getByRole("button", { name: "Publicar" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Error 503/504: Sin conexión con el servidor", expect.anything()),
    );
    expect(within(dialog).getByRole("button", { name: "Publicar" })).toBeEnabled();
    expect(screen.getByLabelText("Título")).toHaveValue("Encuesta de Empleabilidad");
    expect(push).not.toHaveBeenCalled();
  });

  it("CA11: muestra el mensaje de encuesta duplicada junto al título", async () => {
    vi.mocked(surveysService.createSurvey).mockRejectedValue(
      buildAxiosError(409, {
        statusCode: 409,
        ok: false,
        detail: SURVEY_MESSAGES.duplicatedTitle,
        data: { field: "title" },
      }),
    );
    const user = renderView();
    await fillValidSurvey(user);
    await user.click(screen.getByRole("button", { name: /Publicar encuesta/ }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Publicar" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SURVEY_MESSAGES.duplicatedTitle, expect.anything()));
    expect(screen.getByLabelText("Título")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(SURVEY_MESSAGES.duplicatedTitle, { selector: "p" })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("CA11: también valida el duplicado al guardar un borrador", async () => {
    vi.mocked(surveysService.createSurvey).mockRejectedValue(
      buildAxiosError(409, { detail: SURVEY_MESSAGES.duplicatedTitle, data: { field: "title" } }),
    );
    const user = renderView();
    await user.type(screen.getByLabelText("Título"), "Encuesta repetida");

    await user.click(screen.getByRole("button", { name: /Guardar borrador/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SURVEY_MESSAGES.duplicatedTitle, expect.anything()));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra el detalle del servidor ante un error inesperado", async () => {
    vi.mocked(surveysService.createSurvey).mockRejectedValue(buildAxiosError(500, { detail: "Fallo interno" }));
    const user = renderView();
    await user.type(screen.getByLabelText("Título"), "Encuesta con error");

    await user.click(screen.getByRole("button", { name: /Guardar borrador/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Fallo interno", { richColors: true }));
  });

  it("CA12: guarda un borrador solo con el título sin validar la publicación", async () => {
    const user = renderView();
    await user.type(screen.getByLabelText("Título"), "Borrador inicial");

    await user.click(screen.getByRole("button", { name: /Guardar borrador/ }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(SURVEY_MESSAGES.draftSaved, { richColors: true }));
    expect(surveysService.createSurvey).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Borrador inicial", status: "draft", careerId: undefined, opensAt: undefined }),
    );
    expect(push).toHaveBeenCalledWith("/backoffice/surveys");
  });

  it("CA12: la vista previa muestra la encuesta como la verá el titulado sin enviar nada", async () => {
    const user = renderView();
    await user.type(screen.getByLabelText("Título"), "Encuesta de prueba");
    await user.type(screen.getByLabelText("Enunciado de la pregunta 1"), "¿Trabajas?");
    await user.type(screen.getByLabelText("Texto de la opción 1"), "Sí");

    await user.click(screen.getByText("Vista previa", { selector: "button" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Encuesta de prueba")).toBeInTheDocument();
    expect(within(dialog).getByText(SURVEY_MESSAGES.previewNotice)).toBeInTheDocument();
    expect(within(dialog).getByRole("radio", { name: "Sí" })).toBeInTheDocument();
    expect(within(dialog).getByRole("radio", { name: "Opción 2" })).toBeInTheDocument();
    expect(surveysService.createSurvey).not.toHaveBeenCalled();
  });

  it("CA13: cancela sin cambios y vuelve al listado directamente", async () => {
    const user = renderView();

    await user.click(screen.getByRole("button", { name: /Cancelar/ }));

    expect(push).toHaveBeenCalledWith("/backoffice/surveys");
  });

  it("CA13: con cambios pide confirmación y permite seguir editando o descartar", async () => {
    const user = renderView();
    await user.type(screen.getByLabelText("Título"), "Cambios sin guardar");

    await user.click(screen.getByRole("button", { name: /Cancelar/ }));
    let dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("¿Descartar cambios?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Seguir editando" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Título")).toHaveValue("Cambios sin guardar");
    expect(push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Cancelar/ }));
    dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Descartar" }));

    expect(push).toHaveBeenCalledWith("/backoffice/surveys");
    expect(surveysService.createSurvey).not.toHaveBeenCalled();
  });

  it("CA13: con cambios bloquea la recarga y los enlaces internos", async () => {
    const user = renderView();
    await user.type(screen.getByLabelText("Título"), "Cambios");

    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    const sidebarLink = document.createElement("a");
    sidebarLink.href = "/backoffice/surveys";
    sidebarLink.textContent = "Encuestas";
    document.body.append(sidebarLink);
    await user.click(screen.getByRole("link", { name: "Encuestas" }));
    sidebarLink.remove();
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Descartar" }));

    expect(push).toHaveBeenCalledWith("/backoffice/surveys");
  });

  it("muestra un aviso si no se pudieron cargar las carreras", async () => {
    vi.mocked(surveysService.listCareers).mockRejectedValue(new Error("down"));
    renderView();

    expect(await screen.findByText(SURVEY_MESSAGES.careersLoadError)).toBeInTheDocument();
  });
});
