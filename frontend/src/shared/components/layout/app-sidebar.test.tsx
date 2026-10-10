import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { House } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
import { APP_VERSION } from "@/shared/constants/app.constants";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";
import type { AppSidebarProps } from "@/shared/types/app-sidebar-props.types";
import { AppSidebar } from "./app-sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
}));

function renderSidebar(props: AppSidebarProps = {}) {
  return render(
    <SidebarProvider>
      <AppSidebar {...props} />
    </SidebarProvider>,
  );
}

describe("AppSidebar", () => {
  beforeEach(() => {
    stubMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the brand name and version when no user is provided", () => {
    renderSidebar();

    expect(screen.getByText("UMSSY")).toBeDefined();
    expect(screen.getByText(APP_VERSION)).toBeDefined();
    expect(screen.queryByText("Alejandro Vargas")).toBeNull();
    expect(screen.queryByText("Administrador")).toBeNull();
    expect(document.querySelector('[data-slot="sidebar-footer"]')).toBeNull();
  });

  it("shows the role in the brand when a user is provided", () => {
    renderSidebar({ user: { fullName: "Ana Pérez", role: "Admin" } });

    expect(screen.getByText(`Admin · ${APP_VERSION}`)).toBeDefined();
  });

  it("renders the mentorship group with its two routes", () => {
    renderSidebar();

    const navigation = screen.getByRole("navigation", { name: "Menú principal" });
    expect(within(navigation).getByText("Mentorías")).toBeDefined();
  });

  it("links Mi perfil to the profile page in the default navigation", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Mi perfil" }).getAttribute("href")).toBe("/profile");
  });

  it("does not render routes that are not implemented", () => {
    renderSidebar();

    const navigation = screen.getByRole("navigation", { name: "Menú principal" });
    expect(within(navigation).queryByText("Empleos")).toBeNull();
  });

  it("renders all navigation entries including the Epic 3 section", () => {
    renderSidebar();

    const navigation = screen.getByRole("navigation", { name: "Menú principal" });
    expect(within(navigation).getByText("Inicio")).toBeDefined();
    expect(within(navigation).getByText("Mi perfil")).toBeDefined();
    expect(within(navigation).getByText("Mentorías")).toBeDefined();
    expect(within(navigation).getByText("Reportes Analíticos")).toBeDefined();
    expect(within(navigation).getByText("RADAR DE AFINIDAD")).toBeDefined();
    expect(within(navigation).getByText("Radar de afinidad")).toBeDefined();
    expect(within(navigation).getByText("Cola de revisión")).toBeDefined();
    expect(within(navigation).getByText("Búsqueda de candidatos")).toBeDefined();
  });

  it("shows the report history option inside the analytics reports menu", () => {
    renderSidebar();

    fireEvent.click(screen.getByRole("button", { name: "Reportes Analíticos" }));

    const historyLink = screen.getByRole("link", { name: "Historial de reportes generados" });
    expect(historyLink.getAttribute("href")).toBe("/reports/history");
  });

  it("renders the items and user received by props", () => {
    renderSidebar({
      items: [{ label: "Inicio", icon: House, href: "/home" }],
      user: { fullName: "María Pérez", role: "Egresada" },
    });

    expect(screen.getByRole("link", { name: "Inicio" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("María Pérez")).toBeDefined();
    expect(screen.getByText("MP")).toBeDefined();
  });

  it("marks the active item with an accent dot", () => {
    renderSidebar({
      items: [{ label: "Inicio", icon: House, href: "/home" }],
    });

    const link = screen.getByRole("link", { name: "Inicio" });
    const dot = link.querySelector(".bg-accent.rounded-full");
    expect(dot).not.toBeNull();
  });

  it("does not show the accent dot on inactive items", () => {
    renderSidebar({
      items: [{ label: "Inicio", icon: House, href: "/other" }],
    });

    const link = screen.getByRole("link", { name: "Inicio" });
    const dot = link.querySelector(".bg-accent.rounded-full");
    expect(dot).toBeNull();
  });

  it("renders section labels for NavigationSection entries", () => {
    renderSidebar({
      items: [
        { label: "Inicio", icon: House, href: "/" },
        {
          sectionLabel: "MI SECCIÓN",
          items: [{ label: "Sub", icon: House, href: "/sub" }],
        },
      ],
    });

    expect(screen.getByText("MI SECCIÓN")).toBeDefined();
    expect(screen.getByRole("link", { name: "Sub" })).toBeDefined();
  });
});
