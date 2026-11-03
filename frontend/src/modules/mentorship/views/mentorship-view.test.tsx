import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY } from "../constants/mentorship-wizard.constants";
import { clearMentorshipWizardDraft } from "../services/mentorship-wizard-draft.service";
import { mentorParticipationService } from "@/modules/mentors/services/mentor-participation.service";
import {
  clearAccessToken,
  saveAccessToken,
} from "@/shared/services/storage/access-token-storage";
import { MentorshipView } from "./mentorship-view";

const integrationMocks = vi.hoisted(() => ({
  activateMentor: vi.fn(),
  push: vi.fn(),
  retryTechnicalAreas: vi.fn(),
  retryOrientationTypes: vi.fn(),
  isTechnicalAreasError: false,
  isOrientationTypesError: false,
}));
const drafts = vi.hoisted(() => new Map<string, unknown>());

vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  readIndexedDb: vi.fn(async (key: string) => drafts.get(key) ?? null),
  writeIndexedDb: vi.fn(async (key: string, value: unknown) => {
    drafts.set(key, value);
  }),
  removeIndexedDb: vi.fn(async (key: string) => {
    drafts.delete(key);
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: integrationMocks.push }),
}));

vi.mock("../services/mentor-activation.service", () => ({
  activateMentor: integrationMocks.activateMentor,
}));

vi.mock("../hooks/use-mentorship-catalogs", () => ({
  useMentorshipCatalogs: () => ({
    technicalAreas: [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Backend",
        description: "Desarrollo backend",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Frontend",
        description: "Desarrollo frontend",
      },
    ],
    orientationTypes: [
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        name: "Orientación profesional",
        description: "Orientación profesional",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        name: "Orientación técnica",
        description: "Orientación técnica",
      },
    ],
    isTechnicalAreasLoading: false,
    isTechnicalAreasError: integrationMocks.isTechnicalAreasError,
    retryTechnicalAreas: integrationMocks.retryTechnicalAreas,
    isOrientationTypesLoading: false,
    isOrientationTypesError: integrationMocks.isOrientationTypesError,
    retryOrientationTypes: integrationMocks.retryOrientationTypes,
  }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.spyOn(mentorParticipationService, "capacity").mockResolvedValue({
    available: 1,
    capacity: 2,
    occupied: 1,
  });
  saveAccessToken("mentor-token");
  vi.spyOn(mentorParticipationService, "getMyParticipation").mockResolvedValue({ status: "NEVER", areas: [], orientations: [] });
  vi.spyOn(mentorParticipationService, "getCurrent").mockResolvedValue(null);
  integrationMocks.isTechnicalAreasError = false;
  integrationMocks.isOrientationTypesError = false;
  integrationMocks.activateMentor.mockResolvedValue({
    id: "550e8400-e29b-41d4-a716-446655440005",
  });
});

afterEach(async () => {
  cleanup();
  await clearMentorshipWizardDraft();
  clearAccessToken();
  vi.unstubAllEnvs();
});

function advanceToConfirmation() {
  fireEvent.click(screen.getByRole("checkbox"));

  const nextButton = screen.getByRole("button", {
    name: /Continuar/i,
  });

  fireEvent.click(nextButton);
  fireEvent.click(screen.getByRole("button", { name: /Backend/i }));
  fireEvent.click(nextButton);
  fireEvent.click(
    screen.getByRole("button", { name: /Orientación profesional/i }),
  );
  fireEvent.click(nextButton);
}

async function openActivationDialog() {
  fireEvent.click(
    screen.getByRole("button", { name: "Activar participación" }),
  );

  return screen.findByRole("alertdialog");
}

describe("MentorshipView", () => {
  it("reconoce al mentor activo sin ofrecer otra activación", async () => {
    saveAccessToken("mentor-token");
    vi.spyOn(
      mentorParticipationService,
      "getMyParticipation",
    ).mockResolvedValue({ status: "ACTIVE", areas: [], orientations: [] });
    renderWithQuery(<MentorshipView />);
    expect(
      await screen.findByRole("heading", {
        name: "Ya se encuentra registrado como mentor",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mi participación" }),
    ).toHaveAttribute("href", "/mentors/participation");
    expect(
      screen.queryByRole("button", { name: "Activar participación" }),
    ).not.toBeInTheDocument();
  });

  it("con cupos ocupados abre el modal después de confirmar sin activar ni perder selecciones", async () => {
    vi.mocked(mentorParticipationService.capacity).mockResolvedValue({
      available: 0,
      capacity: 2,
      occupied: 2,
    });
    vi.stubEnv("NODE_ENV", "development");
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();
    const confirmation = await openActivationDialog();
    fireEvent.click(
      within(confirmation).getByRole("button", { name: "Aceptar" }),
    );
    const unavailable = await screen.findByRole("dialog", {
      name: "No hay cupos disponibles",
    });
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(integrationMocks.activateMentor).not.toHaveBeenCalled();
    expect(integrationMocks.push).not.toHaveBeenCalled();
    fireEvent.click(
      within(unavailable).getByRole("button", { name: "Cancelar" }),
    );
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Orientación profesional")).toBeInTheDocument();
    expect(
      drafts.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY) ?? null,
    ).not.toBeNull();
    expect(integrationMocks.activateMentor).not.toHaveBeenCalled();
  });

  it("registra una solicitud real solo al confirmar Solicitar cupo", async () => {
    vi.mocked(mentorParticipationService.capacity).mockResolvedValue({
      available: 0,
      capacity: 2,
      occupied: 2,
    });
    const create = vi
      .spyOn(mentorParticipationService, "create")
      .mockResolvedValue({ id: "request", status: "PENDING" } as never);
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();
    const confirmation = await openActivationDialog();
    fireEvent.click(
      within(confirmation).getByRole("button", { name: "Aceptar" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "No hay cupos disponibles",
    });
    expect(create).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Solicitar cupo" }),
    );
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith({
      technicalAreaIds: ["550e8400-e29b-41d4-a716-446655440001"],
      orientationTypeIds: ["550e8400-e29b-41d4-a716-446655440003"],
    });
    const registered = await screen.findByRole("dialog", {
      name: "Solicitud registrada correctamente",
    });
    expect(within(registered).getByText("Estado: Pendiente")).toBeInTheDocument();
    expect(integrationMocks.push).not.toHaveBeenCalled();
    fireEvent.click(within(registered).getByRole("button", { name: "Cerrar" }));
    expect(integrationMocks.push).toHaveBeenCalledWith(
      "/mentors/participation?registered=1",
    );
    expect(integrationMocks.activateMentor).not.toHaveBeenCalled();
  });

  it.each(["Cancelar", "Escape"])(
    "muestra la sanción solo dentro del modal y la limpia al cerrar con %s",
    async (closeAction) => {
      const sanctionMessage =
        "Tu capacidad para solicitar participación como mentor ha sido suspendida temporalmente. Podrás volver a intentarlo al finalizar la sanción";
      vi.mocked(mentorParticipationService.capacity).mockResolvedValue({
        available: 0,
        capacity: 2,
        occupied: 2,
      });
      const create = vi.spyOn(mentorParticipationService, "create").mockRejectedValue({
        isAxiosError: true,
        response: { status: 429, data: { detail: sanctionMessage } },
      });
      const { container } = renderWithQuery(<MentorshipView />);
      await screen.findByRole("checkbox");
      advanceToConfirmation();
      const confirmation = await openActivationDialog();
      fireEvent.click(within(confirmation).getByRole("button", { name: "Aceptar" }));
      const dialog = await screen.findByRole("dialog", { name: "No hay cupos disponibles" });
      fireEvent.click(within(dialog).getByRole("button", { name: "Solicitar cupo" }));

      expect(await within(dialog).findByRole("alert")).toHaveTextContent(sanctionMessage);
      // Text queries include hidden elements, including the wizard behind the modal.
      expect(screen.getAllByText(sanctionMessage)).toHaveLength(1);
      expect(within(container).queryByText(sanctionMessage)).not.toBeInTheDocument();
      expect(create).toHaveBeenCalledTimes(1);
      expect(integrationMocks.push).not.toHaveBeenCalled();

      if (closeAction === "Cancelar") {
        fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
      } else {
        fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
      }
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(screen.queryByText(sanctionMessage)).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      const retryConfirmation = await openActivationDialog();
      fireEvent.click(within(retryConfirmation).getByRole("button", { name: "Aceptar" }));
      const reopened = await screen.findByRole("dialog", { name: "No hay cupos disponibles" });
      expect(within(reopened).queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByText(sanctionMessage)).not.toBeInTheDocument();
    },
  );

  it("mantiene el aviso externo cuando se libera un cupo y el modal se cierra", async () => {
    vi.mocked(mentorParticipationService.capacity).mockResolvedValue({
      available: 0, capacity: 2, occupied: 2,
    });
    vi.spyOn(mentorParticipationService, "create").mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { data: { code: "CAPACITY_AVAILABLE" } } },
    });
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();
    const confirmation = await openActivationDialog();
    fireEvent.click(within(confirmation).getByRole("button", { name: "Aceptar" }));
    const dialog = await screen.findByRole("dialog", { name: "No hay cupos disponibles" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Solicitar cupo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Se liberó un cupo. Confirma nuevamente la activación para incorporarte como mentor.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(integrationMocks.push).not.toHaveBeenCalled();
  });

  it("en producción no utiliza la simulación ni bloquea la activación existente", async () => {
    vi.stubEnv("NODE_ENV", "production");
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();
    expect(
      screen.queryByRole("region", { name: "Simulación de disponibilidad" }),
    ).not.toBeInTheDocument();
    const confirmation = await openActivationDialog();
    fireEvent.click(
      within(confirmation).getByRole("button", { name: "Aceptar" }),
    );
    await waitFor(() =>
      expect(integrationMocks.activateMentor).toHaveBeenCalledTimes(1),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Tu participación como mentor está activa",
      }),
    ).toBeVisible();
    expect(integrationMocks.push).not.toHaveBeenCalled();
  });
  it("renderiza inicialmente el paso 1 con participación desmarcada", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    expect(
      screen.getByRole("heading", { name: "Participación" }),
    ).toBeDefined();

    expect(screen.getByText("Quiero participar como mentor")).toBeDefined();

    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).not.toBeChecked();

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    expect((nextButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("habilita Continuar al seleccionar participación", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    const checkbox = screen.getByRole("checkbox");

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    expect((nextButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("permite seleccionar participación desde toda la fila sin duplicar el cambio", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByText("Quiero participar como mentor"));

    expect(
      screen.getByRole("checkbox", {
        name: "Quiero participar como mentor",
      }),
    ).toBeChecked();
  });

  it("permite avanzar entre los pasos después de aceptar participación", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    fireEvent.click(nextButton);

    expect(screen.getByText("Paso 2: Áreas técnicas")).toBeDefined();
  });

  it("no permite avanzar del paso 2 sin seleccionar un área", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    fireEvent.click(nextButton);

    expect(screen.getByText("Paso 2: Áreas técnicas")).toBeDefined();

    expect((nextButton as HTMLButtonElement).disabled).toBe(true);

    expect(
      screen.getByText("Debe seleccionarse al menos un área para continuar"),
    ).toBeDefined();
  });

  it("permite avanzar del paso 2 al seleccionar al menos un área", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    fireEvent.click(nextButton);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Backend/i,
      }),
    );

    expect((nextButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(nextButton);

    expect(
      screen.getByRole("heading", {
        name: "Paso 3: Tipos de orientación",
      }),
    ).toBeDefined();
  });

  it("no muestra Volver en el primer paso", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    expect(
      screen.queryByRole("button", {
        name: /Volver/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("permite regresar al paso anterior", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    fireEvent.click(nextButton);

    const backButton = screen.getByRole("button", {
      name: /Volver/i,
    });

    fireEvent.click(backButton);

    expect(
      screen.getByRole("heading", {
        name: "Participación",
      }),
    ).toBeDefined();
  });

  it("conserva la participación al avanzar y regresar", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    const checkbox = screen.getByRole("checkbox");

    fireEvent.click(checkbox);

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    fireEvent.click(nextButton);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Volver/i,
      }),
    );

    const participationCheckbox = screen.getByRole("checkbox");

    expect(participationCheckbox).toBeChecked();
  });

  it("muestra el título principal del wizard", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    expect(screen.getByText("Participa como mentor")).toBeDefined();
  });

  it("actualiza el contador al seleccionar áreas", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    fireEvent.click(nextButton);

    expect(screen.getByText("0 seleccionadas")).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Backend/i,
      }),
    );

    expect(screen.getByText("1 seleccionada")).toBeDefined();
  });

  it("deshabilita Continuar en el paso 3 sin orientación seleccionada", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    fireEvent.click(nextButton);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Backend/i,
      }),
    );

    fireEvent.click(nextButton);

    expect(
      screen.getByRole("heading", {
        name: "Paso 3: Tipos de orientación",
      }),
    ).toBeDefined();

    expect((nextButton as HTMLButtonElement).disabled).toBe(true);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Debe seleccionarse al menos un tipo de orientación para continuar",
    );
  });

  it("habilita Continuar en el paso 3 al seleccionar una orientación", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    fireEvent.click(nextButton);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Backend/i,
      }),
    );

    fireEvent.click(nextButton);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Orientación profesional/i,
      }),
    );

    expect((nextButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("muestra la confirmación en el último paso", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    fireEvent.click(nextButton);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Backend/i,
      }),
    );

    fireEvent.click(nextButton);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Orientación profesional/i,
      }),
    );

    fireEvent.click(nextButton);

    expect(
      screen.getByRole("heading", {
        name: "Confirma tu participación",
      }),
    ).toBeDefined();

    expect(
      screen.getByRole("button", {
        name: "Activar participación",
      }),
    ).toBeDefined();
  });

  it("muestra las orientaciones y permite seleccionar varias", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    fireEvent.click(nextButton);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Backend/i,
      }),
    );

    fireEvent.click(nextButton);

    const professionalButton = screen.getByRole("button", {
      name: /Orientación profesional/i,
    });

    const technicalButton = screen.getByRole("button", {
      name: /Orientación técnica/i,
    });

    fireEvent.click(professionalButton);
    fireEvent.click(technicalButton);

    expect(screen.getByText("2 seleccionadas")).toBeDefined();

    expect(professionalButton.getAttribute("aria-pressed")).toBe("true");

    expect(technicalButton.getAttribute("aria-pressed")).toBe("true");
  });

  it("conserva las orientaciones al avanzar y regresar", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));

    const nextButton = screen.getByRole("button", {
      name: /Continuar/i,
    });

    fireEvent.click(nextButton);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Backend/i,
      }),
    );

    fireEvent.click(nextButton);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Orientación profesional/i,
      }),
    );

    fireEvent.click(nextButton);

    expect(
      screen.getByRole("heading", {
        name: "Confirma tu participación",
      }),
    ).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Volver/i,
      }),
    );

    expect(screen.getByText("1 seleccionada")).toBeDefined();

    const professionalButton = screen.getByRole("button", {
      name: /Orientación profesional/i,
    });

    expect(professionalButton.getAttribute("aria-pressed")).toBe("true");
  });

  it("retries only technical areas from their error state", async () => {
    integrationMocks.isTechnicalAreasError = true;
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(integrationMocks.retryTechnicalAreas).toHaveBeenCalledTimes(1);
    expect(integrationMocks.retryOrientationTypes).not.toHaveBeenCalled();
  });

  it("does not show a technical-area error when orientation types fail", async () => {
    integrationMocks.isOrientationTypesError = true;
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    expect(screen.getByText("Paso 2: Áreas técnicas")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(
      screen.queryByText("No se pudieron cargar las áreas técnicas."),
    ).not.toBeInTheDocument();
  });

  it("shows the confirmation dialog without activating when pressing Activar participación", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();

    const dialog = await openActivationDialog();

    expect(
      within(dialog).getByText(
        "¿Está seguro de que desea activar su participación como mentor?",
      ),
    ).toBeInTheDocument();
    expect(integrationMocks.activateMentor).not.toHaveBeenCalled();
  });

  it("closes the dialog on cancel without calling the service and keeps the selections", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();

    const dialog = await openActivationDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(integrationMocks.activateMentor).not.toHaveBeenCalled();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Orientación profesional")).toBeInTheDocument();
  });

  it("shows success only after one activation resolves and clears the draft", async () => {
    let resolveActivation!: (value: { id: string }) => void;
    integrationMocks.activateMentor.mockReturnValue(
      new Promise((resolve) => {
        resolveActivation = resolve;
      }),
    );
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();

    await waitFor(() => {
      expect(
        drafts.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY) ?? null,
      ).not.toBeNull();
    });

    const dialog = await openActivationDialog();
    const confirmButton = within(dialog).getByRole("button", {
      name: "Aceptar",
    });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(integrationMocks.activateMentor).toHaveBeenCalledTimes(1),
    );
    expect(integrationMocks.activateMentor).toHaveBeenCalledWith({
      technicalAreaIds: ["550e8400-e29b-41d4-a716-446655440001"],
      orientationTypeIds: ["550e8400-e29b-41d4-a716-446655440003"],
    });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Tu participación como mentor está activa",
      }),
    ).not.toBeInTheDocument();
    expect(
      drafts.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY) ?? null,
    ).not.toBeNull();

    await act(async () => {
      resolveActivation({ id: "550e8400-e29b-41d4-a716-446655440005" });
    });

    expect(
      screen.getByRole("heading", {
        name: "Tu participación como mentor está activa",
      }),
    ).toBeInTheDocument();
    expect(drafts.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY) ?? null).toBeNull();
  });

  it("keeps selections and the draft when activation returns a conflict", async () => {
    integrationMocks.activateMentor.mockRejectedValue({
      isAxiosError: true,
      response: { status: 409 },
    });
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();

    await waitFor(() => {
      expect(
        drafts.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY) ?? null,
      ).not.toBeNull();
    });

    const dialog = await openActivationDialog();
    fireEvent.click(within(dialog).getByRole("button", { name: "Aceptar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Tu participación como mentor ya está activa.",
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Orientación profesional")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Tu participación como mentor está activa",
      }),
    ).not.toBeInTheDocument();
    expect(
      drafts.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY) ?? null,
    ).not.toBeNull();
  });

  it.each(["MENTOR_OFFER_CONFIRMATION_REQUIRED", "REQUEST_ALREADY_EXISTS"])(
    "guía a Mi participación cuando el servidor devuelve %s sin mostrar éxito",
    async (code) => {
      integrationMocks.activateMentor.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 409,
          data: {
            detail: "Revisa tu solicitud u oferta vigente.",
            data: { code },
          },
        },
      });
      renderWithQuery(<MentorshipView />);
      await screen.findByRole("checkbox");
      advanceToConfirmation();
      const dialog = await openActivationDialog();
      fireEvent.click(within(dialog).getByRole("button", { name: "Aceptar" }));
      expect(
        await screen.findByRole("link", {
          name: "Revisar mi solicitud u oferta",
        }),
      ).toHaveAttribute("href", "/mentors/participation");
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Revisa tu solicitud u oferta vigente.",
      );
      expect(
        screen.queryByRole("heading", {
          name: "Tu participación como mentor está activa",
        }),
      ).not.toBeInTheDocument();
      expect(drafts.get(MENTORSHIP_WIZARD_DRAFT_STORAGE_KEY)).not.toBeNull();
    },
  );
});


describe("Issue #1858: protección del formulario", () => {
  const requestWithStatus = (status: string) => ({
    id: "request", userId: "user", status,
    queuedAt: "2026-11-01T00:00:00Z", createdAt: "2026-11-01T00:00:00Z",
    technicalAreaIds: [], orientationTypeIds: [],
  });

  it.each([
    ["PENDING", "Ya tienes una solicitud pendiente", "Mi participación"],
    ["OFFERED", "Ya tienes un cupo ofrecido", "Ver mi cupo ofrecido"],
  ])("bloquea el acceso directo para %s", async (status, heading, action) => {
    vi.mocked(mentorParticipationService.getCurrent).mockResolvedValue(requestWithStatus(status));
    renderWithQuery(<MentorshipView />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: heading })).toBeVisible();
    expect(screen.getByRole("link", { name: action })).toHaveAttribute("href", "/mentors/participation");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(mentorParticipationService.capacity).not.toHaveBeenCalled();
    expect(screen.queryByText("No hay cupos disponibles")).not.toBeInTheDocument();
  });

  it.each([null, "CANCELLED", "EXPIRED"])("permite iniciar el proceso con %s sin omitir reglas del backend", async (status) => {
    vi.mocked(mentorParticipationService.getCurrent).mockResolvedValue(status ? requestWithStatus(status) : null);
    renderWithQuery(<MentorshipView />);
    expect(await screen.findByRole("checkbox")).toBeVisible();
    expect(integrationMocks.activateMentor).not.toHaveBeenCalled();
  });

  it.each(["getCurrent", "getMyParticipation"] as const)("oculta el formulario mientras carga %s", async (method) => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    vi.mocked(mentorParticipationService[method]).mockImplementationOnce(async () => {
      await pending;
      return (method === "getCurrent" ? null : { status: "NEVER", areas: [], orientations: [] }) as never;
    });
    renderWithQuery(<MentorshipView />);
    expect(screen.getByRole("status")).toHaveTextContent("Verificando tu participación");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    await act(async () => finish());
    expect(await screen.findByRole("checkbox")).toBeVisible();
  });

  it.each(["getCurrent", "getMyParticipation"] as const)("bloquea si falla %s y permite reintentar", async (method) => {
    vi.mocked(mentorParticipationService[method]).mockRejectedValueOnce(new Error("offline"));
    renderWithQuery(<MentorshipView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo verificar tu participación");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("checkbox")).toBeVisible();
  });

  it.each(["pageshow", "popstate"])("revalida al restaurar la página con %s", async (event) => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    vi.mocked(mentorParticipationService.getCurrent).mockResolvedValue(requestWithStatus("OFFERED"));
    act(() => { window.dispatchEvent(new Event(event)); });
    expect(await screen.findByRole("heading", { name: "Ya tienes un cupo ofrecido" })).toBeVisible();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("vuelve a consultar al recargar o navegar internamente con datos en caché", async () => {
    const view = renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    view.rerender(<></>);
    vi.mocked(mentorParticipationService.getCurrent).mockResolvedValue(requestWithStatus("PENDING"));
    view.rerender(<MentorshipView />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Ya tienes una solicitud pendiente" })).toBeVisible();
  });

  it.each(["PENDING", "OFFERED", "ACTIVE"])("revalida antes de activar y bloquea si cambió a %s", async (status) => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();
    const dialog = await openActivationDialog();
    if (status === "ACTIVE") {
      vi.mocked(mentorParticipationService.getMyParticipation).mockResolvedValue({ status: "ACTIVE", areas: [], orientations: [] });
    } else {
      vi.mocked(mentorParticipationService.getCurrent).mockResolvedValue(requestWithStatus(status));
    }
    fireEvent.click(within(dialog).getByRole("button", { name: "Aceptar" }));
    expect(await screen.findByRole("link", { name: status === "OFFERED" ? "Ver mi cupo ofrecido" : "Mi participación" })).toBeVisible();
    expect(mentorParticipationService.capacity).not.toHaveBeenCalled();
    expect(integrationMocks.activateMentor).not.toHaveBeenCalled();
    expect(screen.queryByText("No hay cupos disponibles")).not.toBeInTheDocument();
  });

  it("revalida antes de registrar la solicitud desde el modal de capacidad", async () => {
    const create = vi.spyOn(mentorParticipationService, "create");
    vi.mocked(mentorParticipationService.capacity).mockResolvedValue({ available: 0, occupied: 2, capacity: 2 });
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();
    const confirmation = await openActivationDialog();
    fireEvent.click(within(confirmation).getByRole("button", { name: "Aceptar" }));
    const dialog = await screen.findByRole("dialog", { name: "No hay cupos disponibles" });
    vi.mocked(mentorParticipationService.getCurrent).mockResolvedValue(requestWithStatus("OFFERED"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Solicitar cupo" }));
    expect(await screen.findByRole("heading", { name: "Ya tienes un cupo ofrecido" })).toBeVisible();
    expect(create).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("no activa si falla la revalidación y permite recuperar el formulario", async () => {
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();
    const dialog = await openActivationDialog();
    vi.mocked(mentorParticipationService.getCurrent).mockRejectedValueOnce(new Error("offline"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Aceptar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo verificar tu participación");
    expect(integrationMocks.activateMentor).not.toHaveBeenCalled();
    expect(mentorParticipationService.capacity).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("button", { name: "Activar participación" })).toBeVisible();
  });
  it("detecta una oferta asignada mientras se consultaba la capacidad", async () => {
    vi.mocked(mentorParticipationService.capacity).mockImplementationOnce(async () => {
      vi.mocked(mentorParticipationService.getCurrent).mockResolvedValue(requestWithStatus("OFFERED"));
      return { available: 0, occupied: 2, capacity: 2 };
    });
    renderWithQuery(<MentorshipView />);
    await screen.findByRole("checkbox");
    advanceToConfirmation();
    const confirmation = await openActivationDialog();
    fireEvent.click(within(confirmation).getByRole("button", { name: "Aceptar" }));
    expect(await screen.findByRole("heading", { name: "Ya tienes un cupo ofrecido" })).toBeVisible();
    expect(screen.queryByText("No hay cupos disponibles")).not.toBeInTheDocument();
    expect(integrationMocks.activateMentor).not.toHaveBeenCalled();
  });

  it("no expone el formulario antes de disponer de la sesión", () => {
    clearAccessToken();
    renderWithQuery(<MentorshipView />);
    expect(screen.getByRole("status")).toHaveTextContent("Verificando tu participación");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(mentorParticipationService.getCurrent).not.toHaveBeenCalled();
  });

});
