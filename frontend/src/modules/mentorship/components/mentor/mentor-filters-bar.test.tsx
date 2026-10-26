import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MentorFiltersBar } from "./mentor-filters-bar";

afterEach(() => {
  cleanup();
});

const technicalAreas = [
  { id: "area-backend", name: "Backend", description: null },
];

const orientationTypes = [
  { id: "1", name: "Búsqueda de empleo", description: null },
  { id: "2", name: "Orientación profesional", description: null },
  { id: "3", name: "Preparación para entrevistas", description: null },
  { id: "4", name: "Revisión de CV", description: null },
  { id: "5", name: "Orientación técnica", description: null },
];

describe("MentorFiltersBar", () => {
  it("permite seleccionar un área técnica", async () => {
    const onAreaChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MentorFiltersBar
        area=""
        orientation=""
        technicalAreas={technicalAreas}
        orientationTypes={orientationTypes}
        onAreaChange={onAreaChange}
        onOrientationChange={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("combobox", { name: "Área técnica" }),
    );
    await user.click(screen.getByRole("option", { name: "Backend" }));

    expect(onAreaChange).toHaveBeenCalledWith("Backend");
  });

  it("lista los cinco tipos y permite seleccionar orientación", async () => {
    const onOrientationChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MentorFiltersBar
        area=""
        orientation=""
        technicalAreas={technicalAreas}
        orientationTypes={orientationTypes}
        onAreaChange={vi.fn()}
        onOrientationChange={onOrientationChange}
      />,
    );

    await user.click(
      screen.getByRole("combobox", { name: "Orientación" }),
    );

    for (const option of orientationTypes) {
      expect(
        screen.getByRole("option", { name: option.name }),
      ).toBeInTheDocument();
    }

    await user.click(
      screen.getByRole("option", { name: "Orientación técnica" }),
    );

    expect(onOrientationChange).toHaveBeenCalledWith("Orientación técnica");
  });
});
