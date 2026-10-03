import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen } from "@testing-library/react";
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

  it("renderiza enlaces hacia los perfiles de los mentores", async () => {
    render(<MentorDirectoryView />);

    expect(
      (await screen.findAllByRole("link", {
        name: /Ver perfil de/i,
      })).length,
    ).toBeGreaterThan(0);
  });
});