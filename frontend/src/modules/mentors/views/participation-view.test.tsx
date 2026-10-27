import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { loadMentorshipWizardDraft, saveMentorshipWizardDraft } from "@/modules/mentorship/services/mentorship-wizard-draft.service";
import { mentorParticipationService, type MyMentorParticipation } from "../services/mentor-participation.service";
import { ParticipationView } from "./participation-view";
import { writeIndexedDb } from "@/shared/services/storage/browser-indexed-db";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
const drafts = vi.hoisted(() => new Map<string, unknown>());
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/shared/services/storage/browser-indexed-db", () => ({
  readIndexedDb: vi.fn(async (key: string) => drafts.get(key) ?? null),
  writeIndexedDb: vi.fn(async (key: string, value: unknown) => { drafts.set(key, value); }),
  removeIndexedDb: vi.fn(async (key: string) => { drafts.delete(key); }),
}));

const active: MyMentorParticipation = {
  status: "ACTIVE",
  areas: [{ id: "area-1", name: "Backend" }],
  orientations: [{ id: "orientation-1", name: "Orientación profesional" }],
};
const deactivated: MyMentorParticipation = { ...active, status: "DEACTIVATED" };

describe("ParticipationView HU-MEN-06", () => {
  beforeEach(() => {
    sessionStorage.setItem("accessToken", "test-token");
    vi.spyOn(mentorParticipationService, "getCurrent").mockResolvedValue(null);
    vi.spyOn(mentorParticipationService, "getMyParticipation").mockResolvedValue(active);
  });

  afterEach(() => {
    cleanup();
    drafts.clear();
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    navigation.push.mockReset();
  });

  it("muestra el rol activo sin inferirlo de la disponibilidad y permite editar", async () => {
    renderWithQuery(<ParticipationView />);
    expect(await screen.findByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar áreas técnicas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desactivar participación" })).toBeInTheDocument();
  });

  it("conserva preferencias y oculta acciones de edición al desactivar", async () => {
    vi.mocked(mentorParticipationService.getMyParticipation).mockResolvedValue(deactivated);
    renderWithQuery(<ParticipationView />);
    expect(await screen.findByText("Desactivado")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Editar áreas técnicas" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activar participación" })).toBeInTheDocument();
  });

  it("cancelar no llama al servidor; confirmar sale una sola vez", async () => {
    const leave = vi.spyOn(mentorParticipationService, "leave").mockResolvedValue();
    vi.mocked(mentorParticipationService.getMyParticipation)
      .mockResolvedValueOnce(active).mockResolvedValue(deactivated);
    renderWithQuery(<ParticipationView />);
    fireEvent.click(await screen.findByRole("button", { name: "Desactivar participación" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(leave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Desactivar participación" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Desactivar participación" }));
    await waitFor(() => expect(leave).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Desactivado")).toBeInTheDocument();
  });

  it("mantiene abierto el modal y explica las citas futuras cuando falla la salida", async () => {
    vi.spyOn(mentorParticipationService, "leave").mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { message: "Resuelve las citas futuras", data: { code: "MENTOR_HAS_FUTURE_APPOINTMENTS" } } },
    });
    renderWithQuery(<ParticipationView />);
    fireEvent.click(await screen.findByRole("button", { name: "Desactivar participación" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Desactivar participación" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Resuelve las citas futuras");
    expect(screen.getByRole("link", { name: "Resolver mis citas en la agenda" })).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("bloquea el doble envío de desactivación", async () => {
    const leave = vi.spyOn(mentorParticipationService, "leave").mockImplementation(() => new Promise<void>(() => {}));
    renderWithQuery(<ParticipationView />);
    fireEvent.click(await screen.findByRole("button", { name: "Desactivar participación" }));
    const confirm = within(screen.getByRole("dialog")).getByRole("button", { name: "Desactivar participación" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(leave).toHaveBeenCalledTimes(1);
  });

  it("precarga el wizard al iniciar reincorporación sin activar antes del servidor", async () => {
    vi.mocked(mentorParticipationService.getMyParticipation).mockResolvedValue(deactivated);
    renderWithQuery(<ParticipationView />);
    fireEvent.click(await screen.findByRole("button", { name: "Activar participación" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar a incorporación" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/mentorship"));
    expect(await loadMentorshipWizardDraft()).toEqual({
      currentStep: 1, wantsToParticipate: true,
      selectedTechnicalAreaIds: ["area-1"], selectedOrientationTypeIds: ["orientation-1"],
    });
    expect(navigation.push).toHaveBeenCalledWith("/mentorship");
    expect(screen.getByText("Desactivado")).toBeInTheDocument();
  });

  it("permite continuar sin precarga cuando falla IndexedDB", async () => {
    vi.mocked(mentorParticipationService.getMyParticipation).mockResolvedValue(deactivated);
    vi.mocked(writeIndexedDb).mockRejectedValueOnce(new Error("IndexedDB no está disponible"));
    renderWithQuery(<ParticipationView />);
    fireEvent.click(await screen.findByRole("button", { name: "Activar participación" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar a incorporación" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo recuperar el borrador");
    expect(navigation.push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Continuar a incorporación" }));
    expect(navigation.push).toHaveBeenCalledWith("/mentorship");
  });

  it("respeta un borrador existente del wizard", async () => {
    vi.mocked(mentorParticipationService.getMyParticipation).mockResolvedValue(deactivated);
    await saveMentorshipWizardDraft({ currentStep: 3, wantsToParticipate: true,
      selectedTechnicalAreaIds: ["area-editada"], selectedOrientationTypeIds: ["orientation-1"] });
    renderWithQuery(<ParticipationView />);
    fireEvent.click(await screen.findByRole("button", { name: "Activar participación" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar a incorporación" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/mentorship"));
    expect((await loadMentorshipWizardDraft())?.selectedTechnicalAreaIds).toEqual(["area-editada"]);
  });

  it("permite reintentar cuando falla la consulta de participación", async () => {
    vi.mocked(mentorParticipationService.getMyParticipation)
      .mockRejectedValueOnce(new Error("Network")).mockResolvedValue(active);
    renderWithQuery(<ParticipationView />);
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Activo")).toBeInTheDocument();
  });

  it("muestra un éxito confirmado durante cuatro segundos y permite cerrarlo", async () => {
    const timer = vi.spyOn(window, "setTimeout");
    renderWithQuery(<ParticipationView activated />);
    expect(await screen.findByRole("status")).toHaveTextContent("Participación activada correctamente");
    expect(timer).toHaveBeenCalledWith(expect.any(Function), 4000);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar notificación" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
