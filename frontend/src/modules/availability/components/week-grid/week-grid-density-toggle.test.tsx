import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeekGridDensityToggle } from "./week-grid-density-toggle";

describe("WeekGridDensityToggle", () => {
  afterEach(() => {
    cleanup();
  });

  it("muestra Normal y Compacta, con Normal marcado por defecto", () => {
    render(<WeekGridDensityToggle density="normal" onDensityChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Normal" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Compacta" })).toHaveAttribute("aria-pressed", "false");
  });

  it("marca Compacta cuando density es compact", () => {
    render(<WeekGridDensityToggle density="compact" onDensityChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Compacta" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Normal" })).toHaveAttribute("aria-pressed", "false");
  });

  it("dispara onDensityChange con el valor elegido", async () => {
    const onDensityChange = vi.fn();
    const user = userEvent.setup();
    render(<WeekGridDensityToggle density="normal" onDensityChange={onDensityChange} />);

    await user.click(screen.getByRole("button", { name: "Compacta" }));

    expect(onDensityChange).toHaveBeenCalledWith("compact");
  });
});
