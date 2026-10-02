import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/events",
}));

describe("Sidebar", () => {
  it("navega a Talleres y Mis pases sin mostrar opciones excluidas", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Talleres" }).getAttribute("href")).toBe("/events");
    expect(screen.getByRole("link", { name: "Talleres" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Mis pases" }).getAttribute("href")).toBe("/mis-pases");
    expect(screen.queryByText("Proponer")).toBeNull();
    expect(screen.queryByText("Propuestas")).toBeNull();
  });
});