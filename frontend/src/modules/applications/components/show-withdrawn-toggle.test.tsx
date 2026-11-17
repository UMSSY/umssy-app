import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShowWithdrawnToggle } from "./show-withdrawn-toggle";

afterEach(cleanup);

describe("ShowWithdrawnToggle", () => {
  it("shows the Postulaciones retiradas button as not pressed", () => {
    render(<ShowWithdrawnToggle pressed={false} onPressedChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Postulaciones retiradas" })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the button as pressed while the withdrawn applications are listed", () => {
    render(<ShowWithdrawnToggle pressed onPressedChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Postulaciones retiradas" })).toHaveAttribute("aria-pressed", "true");
  });

  it("asks to show the withdrawn applications when the button is pressed", () => {
    const onPressedChange = vi.fn();
    render(<ShowWithdrawnToggle pressed={false} onPressedChange={onPressedChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Postulaciones retiradas" }));

    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it("asks to hide them again when the button is pressed a second time", () => {
    const onPressedChange = vi.fn();
    render(<ShowWithdrawnToggle pressed onPressedChange={onPressedChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Postulaciones retiradas" }));

    expect(onPressedChange).toHaveBeenCalledWith(false);
  });
});
