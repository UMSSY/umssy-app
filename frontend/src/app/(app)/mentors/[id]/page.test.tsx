import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MentorProfilePage from "./page";

describe("MentorProfilePage", () => {
  it("renderiza el perfil del mentor solicitado", async () => {
    const page = await MentorProfilePage({
      params: Promise.resolve({ id: "1" }),
    });

    render(page);

    expect((await screen.findAllByText("Ana Rojas")).length).toBeGreaterThan(0);
    expect(screen.getByText("Arquitecta de Software")).toBeInTheDocument();
    expect(screen.getByText("Sobre mí")).toBeInTheDocument();
    expect(screen.getByText("Trayectoria actual")).toBeInTheDocument();
    expect(screen.getByText("Áreas técnicas")).toBeInTheDocument();
    expect(screen.getByText("Tipos de orientación")).toBeInTheDocument();
  });
});
