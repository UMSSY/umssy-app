import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardView } from "./dashboard-view";
import type { RoleTag } from "@/shared/types/role-tag.types";
const state = vi.hoisted(() => ({ roles: ["titulado"] as RoleTag[], isLoading: false }));
vi.mock("@/shared/contexts/auth-context", () => ({ useAuth: () => state }));
afterEach(() => { cleanup(); state.roles = ["titulado"]; state.isLoading = false; });
describe("Task dashboard", () => {
  it("offers permitted profile and opportunity destinations", () => {
    render(<DashboardView />);
    expect(screen.getByRole("heading", { name: "Inicio", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Documentos y CV" })).toHaveAttribute("href", "/profile/documents");
    expect(screen.queryByRole("link", { name: "Mi disponibilidad" })).not.toBeInTheDocument();
  });
  it("combines graduate and mentor tasks without duplicating them", () => {
    state.roles = ["titulado", "mentor"]; render(<DashboardView />);
    expect(screen.getAllByRole("link", { name: "Mi disponibilidad" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Mi disponibilidad" })).toHaveAttribute("href", "/mentor/availability");
    expect(screen.getByRole("link", { name: "Mi participación" })).toBeInTheDocument();
  });
  it("offers company tasks without exposing administrative tasks", () => {
    state.roles = ["empresa"]; render(<DashboardView />);
    expect(screen.getByRole("link", { name: "Publicar vacante" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Solicitudes de acceso" })).not.toBeInTheDocument();
  });
  it("announces loading while the account roles are resolved", () => {
    state.isLoading = true; state.roles = []; render(<DashboardView />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando tus espacios");
  });
});
