import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { profileCompletenessService } from "@/modules/profile/services/profile-completeness.service";
import { createProfileCompleteness } from "@/modules/profile/testing/profile-completeness.fixture";
import { PROFILE_COMPLETENESS_QUERY_KEY, PROFILE_COMPLETENESS_SECTION_IDS } from "@/modules/profile/constants/profile-completeness.constants";
import { DashboardView } from "./dashboard-view";
import type { RoleTag } from "@/shared/types/role-tag.types";
const state = vi.hoisted(() => ({ roles: ["titulado"] as RoleTag[], isLoading: false, currentUserId: "owner" }));
vi.mock("@/shared/contexts/auth-context", () => ({ useAuth: () => state }));
vi.mock("@/modules/profile/services/profile-completeness.service", () => ({
  profileCompletenessService: { getCompleteness: vi.fn() },
}));
beforeEach(() => {
  vi.mocked(profileCompletenessService.getCompleteness).mockResolvedValue(
    createProfileCompleteness(["contact", "presentation"]),
  );
});
afterEach(() => { cleanup(); vi.resetAllMocks(); state.roles = ["titulado"]; state.isLoading = false; });
describe("Task dashboard", () => {
  it("offers permitted profile and opportunity destinations", async () => {
    render(<DashboardView />);
    expect(screen.getByRole("heading", { name: "Inicio", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Documentos y CV" })).toHaveAttribute("href", "/profile/documents");
    expect(screen.queryByRole("link", { name: "Mi disponibilidad" })).not.toBeInTheDocument();
    await screen.findByRole("progressbar");
  });
  it("combines graduate and mentor tasks without duplicating them", async () => {
    state.roles = ["titulado", "mentor"]; render(<DashboardView />);
    expect(screen.getAllByRole("link", { name: "Mi disponibilidad" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Mi disponibilidad" })).toHaveAttribute("href", "/mentor/availability");
    expect(screen.getByRole("link", { name: "Mi participación" })).toBeInTheDocument();
    expect(await screen.findAllByRole("progressbar")).toHaveLength(1);
  });
  it("offers company tasks without exposing administrative tasks", async () => {
    state.roles = ["empresa"]; render(<DashboardView />);
    expect(screen.getByRole("link", { name: "Publicar vacante" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Solicitudes de acceso" })).not.toBeInTheDocument();
    await screen.findByRole("progressbar");
  });
  it("announces loading while the account roles are resolved", () => {
    state.isLoading = true; state.roles = []; render(<DashboardView />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando tus espacios");
    expect(profileCompletenessService.getCompleteness).not.toHaveBeenCalled();
  });
});

describe("Dashboard profile completeness", () => {
  it.each([
    { completed: [], percentage: 0 },
    { completed: ["contact", "presentation"] as const, percentage: 30 },
    { completed: PROFILE_COMPLETENESS_SECTION_IDS, percentage: 100 },
  ])("shows $percentage percent between the heading and task groups without profile guidance", async ({ completed, percentage }) => {
    const user = userEvent.setup();
    vi.mocked(profileCompletenessService.getCompleteness).mockResolvedValue(createProfileCompleteness(completed));
    render(<DashboardView />);
    const bar = await screen.findByRole("progressbar", { name: "Completitud del perfil" });
    expect(bar).toHaveAttribute("aria-valuenow", String(percentage));
    expect(screen.getByRole("heading", { name: "Inicio" }).compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bar.compareDocumentPosition(screen.getByRole("region", { name: "Tus espacios" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    if (percentage === 100) {
      expect(screen.queryByRole("region", { name: "Secciones del perfil" })).not.toBeInTheDocument();
      const toggle = screen.getByRole("button", { name: "Ver secciones del perfil" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await user.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(within(screen.getByRole("region", { name: "Secciones del perfil" })).getAllByRole("listitem")).toHaveLength(7);
      expect(screen.getByText("7 de 7 secciones completadas")).toBeVisible();
      await user.click(toggle);
      expect(screen.queryByRole("region", { name: "Secciones del perfil" })).not.toBeInTheDocument();
      await user.click(toggle);
      await user.keyboard("{Escape}");
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    } else {
      const checklist = screen.getByRole("region", { name: "Secciones del perfil" });
      expect(within(checklist).getAllByRole("listitem")).toHaveLength(7);
      expect(within(checklist).getByRole("link", { name: "Completar Documentos y CV" })).toHaveAttribute("href", "/profile/documents#complete-cv");
      expect(screen.queryByRole("button", { name: "Ver secciones del perfil" })).not.toBeInTheDocument();
      await user.click(bar);
      await user.click(screen.getByRole("heading", { name: "Inicio" }));
      await user.keyboard("{Escape}");
      expect(checklist).toBeVisible();
    }
    expect(screen.queryByText(/Continuar mi perfil/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Asistente UMSSY/i)).not.toBeInTheDocument();
  });

  it("collapses when reaching 100 percent and restores the checklist if a section becomes pending", async () => {
    const { client } = render(<DashboardView />);
    const bar = await screen.findByRole("progressbar");
    expect(screen.getByRole("region", { name: "Secciones del perfil" })).toBeVisible();

    vi.mocked(profileCompletenessService.getCompleteness).mockResolvedValue(createProfileCompleteness(PROFILE_COMPLETENESS_SECTION_IDS));
    await act(async () => { await client.invalidateQueries({ queryKey: PROFILE_COMPLETENESS_QUERY_KEY }); });
    await waitFor(() => expect(bar).toHaveAttribute("aria-valuenow", "100"));
    expect(screen.queryByRole("region", { name: "Secciones del perfil" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver secciones del perfil" })).toHaveAttribute("aria-expanded", "false");

    vi.mocked(profileCompletenessService.getCompleteness).mockResolvedValue(createProfileCompleteness(PROFILE_COMPLETENESS_SECTION_IDS.filter((id) => id !== "cv")));
    await act(async () => { await client.invalidateQueries({ queryKey: PROFILE_COMPLETENESS_QUERY_KEY }); });
    await waitFor(() => expect(bar).toHaveAttribute("aria-valuenow", "85"));
    expect(screen.getByRole("region", { name: "Secciones del perfil" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Completar Documentos y CV" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Ver secciones del perfil" })).not.toBeInTheDocument();
  });

  it.each<RoleTag>(["titulado", "estudiante", "mentor", "empresa"])("shows progress for the permitted %s role", async (role) => {
    state.roles = [role];
    render(<DashboardView />);
    expect(await screen.findByRole("progressbar")).toHaveAttribute("aria-valuenow", "30");
  });

  it("does not request completeness for an administrator without profile access", () => {
    state.roles = ["administrativo"];
    render(<DashboardView />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(profileCompletenessService.getCompleteness).not.toHaveBeenCalled();
  });

  it("announces progress loading before displaying the saved value", async () => {
    render(<DashboardView />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando el progreso de tu perfil");
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("progressbar")).toHaveAttribute("aria-valuenow", "30");
  });

  it("allows retrying a failed completeness request", async () => {
    const user = userEvent.setup();
    vi.mocked(profileCompletenessService.getCompleteness).mockRejectedValueOnce(new Error("Network failure"));
    render(<DashboardView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el progreso");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("progressbar")).toHaveAttribute("aria-valuenow", "30");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("refreshes cached progress when returning to Inicio after a saved profile change", async () => {
    const { rerender } = render(<DashboardView />);
    expect(await screen.findByRole("progressbar")).toHaveAttribute("aria-valuenow", "30");
    rerender(<div>Perfil</div>);
    vi.mocked(profileCompletenessService.getCompleteness).mockResolvedValue(createProfileCompleteness(["contact", "presentation", "cv"]));
    rerender(<DashboardView />);
    await waitFor(() => expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "45"));
    expect(profileCompletenessService.getCompleteness).toHaveBeenCalledTimes(2);
  });
});
