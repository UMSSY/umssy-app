import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SurveysView } from "./surveys-view";

describe("SurveysView", () => {
  afterEach(cleanup);

  it("muestra el título de la sección y el estado vacío", () => {
    render(<SurveysView />);

    expect(screen.getByRole("heading", { name: "Encuestas" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Todavía no hay encuestas" })).toBeDefined();
  });
});
