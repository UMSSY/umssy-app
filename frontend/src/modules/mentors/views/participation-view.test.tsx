import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { loadMentorshipWizardDraft, saveMentorshipWizardDraft } from "@/modules/mentorship/services/mentorship-wizard-draft.service";
import { mentorParticipationService, type MyMentorParticipation } from "../services/mentor-participation.service";
import { ParticipationView } from "./participation-view";
import { writeIndexedDb } from "@/shared/services/storage/browser-indexed-db";
import { renderToString } from "react-dom/server";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/services/query-client";

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
    expect(screen.getByRole("button", { name: "Pausar mentoría" })).toBeInTheDocument();
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
    fireEvent.click(await screen.findByRole("button", { name: "Pausar mentoría" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(leave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Pausar mentoría" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("perderás el rol de mentor");
    expect(screen.getByRole("dialog")).toHaveTextContent("No recuperarás automáticamente tu prioridad anterior");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar salida" }));
    await waitFor(() => expect(leave).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Desactivado")).toBeInTheDocument();
  });

  it("mantiene abierto el modal y explica las citas futuras cuando falla la salida", async () => {
    vi.spyOn(mentorParticipationService, "leave").mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { message: "Resuelve las citas futuras", data: { code: "MENTOR_HAS_FUTURE_APPOINTMENTS" } } },
    });
    renderWithQuery(<ParticipationView />);
    fireEvent.click(await screen.findByRole("button", { name: "Pausar mentoría" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar salida" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Resuelve las citas futuras");
    expect(screen.getByRole("link", { name: "Resolver mis citas en la agenda" })).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("bloquea el doble envío de desactivación", async () => {
    const leave = vi.spyOn(mentorParticipationService, "leave").mockImplementation(() => new Promise<void>(() => {}));
    renderWithQuery(<ParticipationView />);
    fireEvent.click(await screen.findByRole("button", { name: "Pausar mentoría" }));
    const confirm = within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar salida" });
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

  it("mantiene estable la carga del servidor sin mostrar estados incorrectos", () => {
    const html = renderToString(<QueryClientProvider client={createQueryClient()}><ParticipationView /></QueryClientProvider>);
    expect(html).toContain("Cargando participación...");
    expect(html).not.toContain("Mi participación como mentor");
    expect(html).not.toContain("Participa como mentor");
  });

  it("mantiene los datos completos y los enlaces del estado activo", async () => {
    vi.mocked(mentorParticipationService.getMyParticipation).mockResolvedValue({
      ...active,
      areas: [...active.areas, { id: "area-2", name: "QA" }],
      orientations: [...active.orientations, { id: "orientation-2", name: "Búsqueda de empleo" }],
    });
    renderWithQuery(<ParticipationView />);
    expect(await screen.findByText("QA")).toBeInTheDocument();
    expect(screen.getByText("Búsqueda de empleo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar áreas técnicas" })).toHaveAttribute("href", "/mentors/participation/technical-areas");
    expect(screen.getByRole("link", { name: "Editar tipos de orientación" })).toHaveAttribute("href", "/mentorship/orientation");
  });

  it("ofrece la incorporación real a quien nunca tuvo participación", async () => {
    vi.mocked(mentorParticipationService.getMyParticipation).mockResolvedValue({ status: "NEVER", areas: [], orientations: [] });
    vi.spyOn(mentorParticipationService, "capacity").mockResolvedValue({ available: 1, capacity: 2, occupied: 1 });
    renderWithQuery(<ParticipationView />);
    expect(await screen.findByRole("link", { name: "Participa como mentor" })).toHaveAttribute("href", "/mentorship");
    expect(screen.queryByText("Desactivado")).not.toBeInTheDocument();
  });

  it("espera ambas consultas y aborta la consulta de participación al salir", async () => {
    const state = vi.mocked(mentorParticipationService.getMyParticipation).mockImplementation(() => new Promise(() => {}));
    const { unmount } = renderWithQuery(<ParticipationView />);
    expect(screen.getByText("Cargando participación...")).toBeInTheDocument();
    await waitFor(() => expect(state).toHaveBeenCalled());
    const signal = state.mock.calls[0][0];
    expect(signal).toBeInstanceOf(AbortSignal);
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it("un error de solicitud no se oculta detrás de un estado sin participación", async () => {
    vi.mocked(mentorParticipationService.getMyParticipation).mockResolvedValue({ status: "NEVER", areas: [], orientations: [] });
    vi.mocked(mentorParticipationService.getCurrent).mockRejectedValueOnce(new Error("Network"));
    renderWithQuery(<ParticipationView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar");
    expect(screen.queryByRole("link", { name: "Participa como mentor" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    vi.spyOn(mentorParticipationService, "capacity").mockResolvedValue({ available: 1, capacity: 2, occupied: 1 });
    expect(await screen.findByRole("link", { name: "Participa como mentor" })).toBeInTheDocument();
  });

  it("ignora el estado antiguo de localStorage y usa los datos del backend", async () => {
    localStorage.setItem("umssy-mentor-participation", JSON.stringify({ status: "active", areas: ["Datos antiguos"] }));
    const read = vi.spyOn(Storage.prototype, "getItem");
    renderWithQuery(<ParticipationView />);
    expect(await screen.findByText("Backend")).toBeInTheDocument();
    expect(screen.queryByText("Datos antiguos")).not.toBeInTheDocument();
    expect(read).not.toHaveBeenCalledWith("umssy-mentor-participation");
  });

  it.each(["NEVER", "DEACTIVATED"] as const)("muestra el vencimiento real y permite reincorporarse en estado %s", async (status) => {
    sessionStorage.setItem("hu7:intake:request", JSON.stringify({ subject: "anonymous", key: "previous-intention" }));
    vi.mocked(mentorParticipationService.getMyParticipation).mockResolvedValue({ ...deactivated, status });
    vi.mocked(mentorParticipationService.getCurrent).mockResolvedValue({
      id: "expired-request", userId: "jwt-user", status: "EXPIRED",
      queuedAt: "2026-10-01T12:00:00Z", createdAt: "2026-10-01T12:00:00Z",
      technicalAreaIds: ["area-1"], orientationTypeIds: ["orientation-1"],
    });
    vi.spyOn(mentorParticipationService, "capacity").mockResolvedValue({ available: 1, capacity: 2, occupied: 1 });
    renderWithQuery(<ParticipationView />);
    expect(await screen.findByText(/El plazo ha vencido/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar participación" })).not.toBeInTheDocument();
    if (status === "NEVER") {
      const start = screen.getByRole("link", { name: "Participa como mentor" });
      expect(start).toHaveAttribute("href", "/mentorship");
      fireEvent.click(start);
    } else {
      fireEvent.click(screen.getByRole("button", { name: "Activar participación" }));
      fireEvent.click(screen.getByRole("button", { name: "Continuar a incorporación" }));
      await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/mentorship"));
    }
    expect(sessionStorage.getItem("hu7:intake:request")).toBeNull();
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
