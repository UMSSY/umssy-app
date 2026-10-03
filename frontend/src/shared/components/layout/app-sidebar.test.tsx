import { cleanup, render, screen, within } from "@testing-library/react";
import { House } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@/components/ui/sidebar";
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

  it("shows the brand and the temporary user by default", () => {
    renderSidebar();

    expect(screen.getByText("UMSSY")).toBeDefined();
    expect(screen.getByText("Universidad para el futuro")).toBeDefined();
    expect(screen.getByText("Alejandro Vargas")).toBeDefined();
    expect(screen.getByText("Administrador")).toBeDefined();
  });

  it("renders the mentorship group with its two routes", () => {
    renderSidebar();

    const navigation = screen.getByRole("navigation", { name: "Menú principal" });
    expect(within(navigation).getByText("Mentorías")).toBeDefined();
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
});
