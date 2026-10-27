import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarToggleButton } from "./sidebar-toggle-button";

const sidebar = vi.hoisted(() => ({ open: true, openMobile: false, isMobile: true, toggleSidebar: vi.fn() }));
vi.mock("@/components/ui/sidebar", () => ({ useSidebar: () => sidebar }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Menú móvil de participación", () => {
  it("permite abrir la navegación móvil aunque el sidebar de escritorio esté expandido", () => {
    render(<SidebarToggleButton />);
    const button = screen.getByRole("button", { name: "Abrir menú" });
    expect(button).toHaveAttribute("tabindex", "0");
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(sidebar.toggleSidebar).toHaveBeenCalledOnce();
  });
});
