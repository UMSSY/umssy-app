import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MentorDirectoryView } from "./mentor-directory-view";

afterEach(cleanup);

describe("MentorDirectoryView", () => {
  it("renderiza el encabezado del directorio", () => {
    render(<MentorDirectoryView />);

    expect(
      screen.getByRole("heading", {
        name: "Directorio de mentores",
      }),
    ).toBeDefined();
  });

  it("renderiza enlaces hacia los perfiles de los mentores", () => {
    render(<MentorDirectoryView />);

    expect(
      screen.getAllByRole("link", {
        name: /Ver perfil de/i,
      }).length,
    ).toBeGreaterThan(0);
  });

  it("permite que el estado de carga controle el directorio", () => {
    render(<MentorDirectoryView isLoading />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando mentores...",
    );
    expect(
      screen.queryByRole("link", {
        name: /Ver perfil de/i,
      }),
    ).toBeNull();
  });
});
