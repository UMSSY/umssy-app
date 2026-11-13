import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ProfileGuidePreviewPage from "./page";

afterEach(() => cleanup());

describe("Profile guide preview page", () => {
  it("renders the temporary preview of the guide animations", () => {
    render(<ProfileGuidePreviewPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Vista de prueba: animaciones de la guía de perfil",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("img", { name: "Asistente virtual UMSSY" }),
    ).toHaveLength(4);
  });
});
