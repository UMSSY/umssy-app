import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { House } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { RoleTag } from "@/shared/types/role-tag.types";
import { ROLE_TAGS } from "@/shared/constants/roles.constants";
import { SIDEBAR_NAVIGATION } from "@/shared/config/navigation.config";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";
import type { AppSidebarProps } from "@/shared/types/app-sidebar-props.types";
import { AppSidebar } from "./app-sidebar";

const sessionRoles = vi.hoisted(() => ({ current: [] as readonly RoleTag[] }));
vi.mock("@/shared/contexts/auth-context", () => ({ useAuth: () => ({ roles: sessionRoles.current, isLoading: false, refreshRoles: vi.fn() }) }));
const route = vi.hoisted(() => ({ pathname: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
function renderSidebar(props: AppSidebarProps = {}) { return render(<SidebarProvider><AppSidebar {...props} /></SidebarProvider>); }

describe("AppSidebar", () => {
  beforeEach(() => { route.pathname = "/dashboard"; sessionRoles.current = ROLE_TAGS; stubMatchMedia(); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
  it("uses the original logo without inventing a user", () => {
    renderSidebar();
    expect(screen.getByRole("img", { name: "UMSSY, Acreditación y comunidad" })).toHaveAttribute("src", "/icons/umssy-logo-web.svg");
    expect(document.querySelector('[data-slot="sidebar-footer"]')).toBeNull();
  });
  it("exposes subsections in each expandable task group", () => {
    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Mentorías" }));
    expect(screen.getByRole("link", { name: "Mi disponibilidad" })).toHaveAttribute("href", "/mentor/availability");
    fireEvent.click(screen.getByRole("button", { name: "Talleres y eventos" }));
    expect(screen.getByRole("link", { name: "Mis inscripciones" })).toHaveAttribute("href", "/events/my-passes");
  });
  it.each([
    ["/events/my-passes", "Talleres y eventos", "Mis inscripciones"],
    ["/mentor/availability", "Mentorías", "Mi disponibilidad"],
    ["/mentorship/orientation", "Mentorías", "Tipos de orientación"],
    ["/backoffice/reports/history", "Reportes", "Historial de reportes"],
    ["/profile/settings", "Mi perfil", "Configuración del perfil"],
  ])("opens the current group and marks only the current destination for %s", (pathname, group, destination) => {
    route.pathname = pathname; renderSidebar();
    expect(screen.getByRole("button", { name: group })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: destination })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("navigation", { name: "Menú principal" }).querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });
  it("keeps the group open for detail routes without selecting an unrelated destination", () => {
    route.pathname = "/mentors/example-id/availability"; renderSidebar();
    expect(screen.getByRole("button", { name: "Mentorías" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("link", { current: "page" })).toBeNull();
  });
  it("renders each authorized top-level entry", () => {
    renderSidebar();
    const navigation = screen.getByRole("navigation", { name: "Menú principal" });
    const top = within(navigation).getAllByRole("listitem").filter((item) => item.getAttribute("data-slot") === "sidebar-menu-item");
    expect(top).toHaveLength(SIDEBAR_NAVIGATION.length);
  });
  it("renders the items and user received by props", () => {
    route.pathname = "/home";
    renderSidebar({ items: [{ label: "Inicio", icon: House, href: "/home" }], user: { fullName: "María Pérez", role: "Egresada" } });
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("María Pérez")).toBeInTheDocument();
  });
  it("filters each child using all roles and reacts when roles change", () => {
    sessionRoles.current = ["titulado"]; const view = renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Mentorías" }));
    expect(screen.getByRole("link", { name: "Mi participación" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mi disponibilidad" })).toBeNull();
    sessionRoles.current = ["titulado", "mentor"];
    view.rerender(<SidebarProvider><AppSidebar /></SidebarProvider>);
    expect(screen.getAllByRole("link", { name: "Mi disponibilidad" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Reportes" })).toBeNull();
    sessionRoles.current = ["administrativo"];
    view.rerender(<SidebarProvider><AppSidebar /></SidebarProvider>);
    expect(screen.getByRole("button", { name: "Reportes" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mentorías" })).toBeNull();
  });
});
