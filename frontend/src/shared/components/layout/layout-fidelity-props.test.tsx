import { cleanup, render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";
import { AppShell } from "./app-shell";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

vi.mock("@/modules/radar-chart/components/radar-notification-popup", () => ({
  RadarNotificationPopup: () => null,
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/backoffice/solicitudes", useRouter: () => ({ push: vi.fn() }) }));

vi.mock("@/modules/notifications/hooks/use-notifications", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/notifications/hooks/use-notifications")>()),
  useNotificationsRealtimeSync: vi.fn(),
  useUnreadNotificationsCount: () => ({ data: { count: 0 } }),
}));

const ITEMS = [{ label: "Solicitudes", icon: Inbox, href: "/backoffice/solicitudes" }];

describe("props opcionales del layout compartido", () => {
  beforeEach(() => stubMatchMedia());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("por defecto el AppShell conserva la marca, el botón de menú y el relleno del contenido", () => {
    render(
      <AppShell items={ITEMS} user={{ fullName: "Ana Pérez", role: "Admin" }}>
        <p>Contenido</p>
      </AppShell>,
    );

    expect(screen.getByRole("img", { name: "UMSSY, Acreditación y comunidad" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar barra lateral" })).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Contenido").parentElement).toHaveClass("px-4", "py-6", "lg:px-12", "lg:py-10");
    expect(screen.queryByLabelText(/pendientes/)).toBeNull();
  });

  it("con las props nuevas reemplaza la marca, el pie y la cabecera, y agrega la insignia", () => {
    render(
      <AppShell
        items={ITEMS}
        brand={<p>Marca propia</p>}
        sidebarFooter={<p>Pie propio</p>}
        sidebarItemClassName="clase-extra"
        sidebarItemBadges={{ Solicitudes: <span aria-label="18 pendientes">18</span> }}
        header={<header>Cabecera propia</header>}
        contentClassName=""
        sidebarWidth="15.5rem"
      >
        <p>Contenido</p>
      </AppShell>,
    );

    expect(screen.getByText("Marca propia")).toBeInTheDocument();
    expect(screen.queryByText("Universidad para el futuro")).toBeNull();
    expect(screen.getByText("Pie propio")).toBeInTheDocument();
    expect(screen.getByText("Cabecera propia")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /menú/i })).toBeNull();
    expect(screen.getByLabelText("18 pendientes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Solicitudes/ })).toHaveClass("clase-extra");
    expect(screen.getByText("Contenido").parentElement).not.toHaveClass("px-8");
  });

  it("el AppSidebar sin props nuevas no agrega insignias ni clases", () => {
    render(
      <SidebarProvider>
        <AppSidebar items={ITEMS} />
      </SidebarProvider>,
    );
    expect(screen.getByRole("link", { name: "Solicitudes" })).not.toHaveClass("clase-extra");
  });
});
