import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarMenu, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNavItem } from "@/shared/components/layout/sidebar-nav-item";
import { SIDEBAR_NAVIGATION } from "@/shared/config/navigation.config";
import { stubMatchMedia } from "@/shared/testing/stub-match-media";

const NOTIFICATIONS_ITEM = SIDEBAR_NAVIGATION.find((item) => item.label === "Notificaciones")!;

function renderSidebarAt(pathname: string) {
  return render(
    <SidebarProvider>
      <SidebarMenu>
        <SidebarNavItem item={NOTIFICATIONS_ITEM} pathname={pathname} />
      </SidebarMenu>
    </SidebarProvider>,
  );
}

function currentLinks() {
  return screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page")
    .map((link) => link.textContent);
}

describe("Resaltado de la bandeja en la barra lateral", () => {
  beforeEach(() => {
    stubMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it.each([
    ["/notifications", "Todas"],
    ["/notifications/surveys", "Notificaciones de Encuestas"],
    ["/notifications/reminders", "Recordatorios"],
    ["/notifications/system", "Sistema"],
  ])("en %s resalta solo %s", (pathname, label) => {
    renderSidebarAt(pathname);

    expect(currentLinks()).toEqual([label]);
  });
});