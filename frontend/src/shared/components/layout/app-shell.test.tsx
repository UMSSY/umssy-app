import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOBILE_MEDIA_QUERY } from "@/shared/constants/viewport.constants";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
}));

vi.mock("@/modules/notifications/hooks/use-notifications", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/notifications/hooks/use-notifications")>()),
  useNotificationsRealtimeSync: vi.fn(),
  useUnreadNotificationsCount: () => ({ data: { count: 0 } }),
}));

describe("AppShell", () => {
  beforeEach(() => {
    stubMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps one main landmark when the view declares its content", () => {
    render(<AppShell><main>Contenido principal</main></AppShell>);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveTextContent("Contenido principal");
  });

  it("renders the sidebar next to the page content", () => {
    render(
      <AppShell>
        <p>Contenido de la página</p>
      </AppShell>,
    );

    expect(screen.getByRole("img", { name: "UMSSY, Acreditación y comunidad" })).toBeDefined();
    expect(screen.getByText("Contenido de la página")).toBeDefined();
    expect(document.querySelector('[data-slot="sidebar-footer"]')).toBeNull();
    expect(screen.queryByText("Alejandro Vargas")).toBeNull();
  });

  it("passes a provided user to the sidebar", () => {
    render(
      <AppShell user={{ fullName: "María Pérez", role: "Egresada" }}>
        Contenido
      </AppShell>,
    );
    expect(screen.getByText("María Pérez")).toBeInTheDocument();
    expect(screen.getByText("Egresada")).toBeInTheDocument();
  });

  it("closes and opens the sidebar with the menu button", () => {
    render(
      <AppShell>
        <p>Contenido de la página</p>
      </AppShell>,
    );

    const sidebar = document.querySelector('[data-slot="sidebar"]');
    const closeButton = screen.getByRole("button", { name: "Cerrar barra lateral" });
    expect(screen.queryByRole("button", { name: "Abrir menú" })).not.toBeInTheDocument();
    expect(sidebar?.getAttribute("data-state")).toBe("expanded");

    fireEvent.click(closeButton);
    const openButton = screen.getByRole("button", { name: "Abrir menú" });
    expect(openButton.getAttribute("aria-expanded")).toBe("false");
    expect(openButton).toHaveFocus();
    expect(sidebar?.getAttribute("data-state")).toBe("collapsed");

    fireEvent.click(openButton);
    expect(screen.getByRole("button", { name: "Cerrar barra lateral" })).toHaveFocus();
    expect(sidebar?.getAttribute("data-state")).toBe("expanded");
  });

  it("closes the mobile drawer with its close button", async () => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: query === MOBILE_MEDIA_QUERY,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(<AppShell>Contenido</AppShell>);

    const toggle = screen.getByRole("button", { name: "Abrir menú" });
    fireEvent.click(toggle);
    const drawer = await screen.findByRole("dialog", { name: "Menú de navegación" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(within(drawer).getByRole("button", { name: "Cerrar barra lateral" }));

    await waitFor(() => expect(drawer).not.toBeInTheDocument());
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
