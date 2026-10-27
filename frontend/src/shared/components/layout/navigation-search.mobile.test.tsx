import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NavigationSearch } from "./navigation-search";
vi.mock("@/shared/contexts/auth-context", () => ({ useAuth: () => ({ roles: ["administrativo"] }) }));
afterEach(cleanup);
describe("Navigation search en celular", () => {
  it("queda como un botón de ícono con nombre accesible y sin el atajo de teclado", () => {
    render(<NavigationSearch />);
    const button = screen.getByRole("button", { name: "Buscar una sección" });
    expect(button).toHaveClass("max-sm:w-9", "max-sm:justify-center");
    expect(screen.getByText("Buscar una sección…")).toHaveClass("max-sm:hidden", "truncate");
    expect(screen.getByText("Ctrl K")).toHaveClass("hidden", "md:inline");
  });
});