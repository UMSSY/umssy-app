import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MentorProfileView } from "./mentor-profile-view";

afterEach(cleanup);

describe("MentorProfileView", () => {
  it("muestra la información del mentor existente", async () => {
    render(<MentorProfileView mentorId="1" />);

    expect((await screen.findAllByText("Ana Rojas")).length).toBeGreaterThan(0);
    expect(screen.getByText("Arquitecta de Software")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Arquitectura")).toBeInTheDocument();
    expect(screen.getByText("Cloud")).toBeInTheDocument();
  });

  it("muestra mensaje cuando el mentor no existe", async () => {
    render(<MentorProfileView mentorId="999" />);

    expect(await screen.findByText("Mentor no encontrado")).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo encontrar el perfil solicitado."),
    ).toBeInTheDocument();
  });
});
