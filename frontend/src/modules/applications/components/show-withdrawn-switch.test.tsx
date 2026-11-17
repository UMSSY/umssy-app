import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShowWithdrawnSwitch } from "./show-withdrawn-switch";

afterEach(cleanup);

describe("ShowWithdrawnSwitch", () => {
  it("names the switch and tells how many withdrawn applications there are", () => {
    render(<ShowWithdrawnSwitch checked={false} onCheckedChange={vi.fn()} count={2} />);

    const toggle = screen.getByRole("switch", { name: "Mostrar postulaciones retiradas (2)" });

    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("reflects the current state", () => {
    render(<ShowWithdrawnSwitch checked onCheckedChange={vi.fn()} count={1} />);

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("reports the new value when it is toggled", async () => {
    const onCheckedChange = vi.fn();
    render(<ShowWithdrawnSwitch checked={false} onCheckedChange={onCheckedChange} count={1} />);

    await userEvent.click(screen.getByRole("switch"));

    await waitFor(() => expect(onCheckedChange).toHaveBeenCalled());
    expect(onCheckedChange.mock.calls[0][0]).toBe(true);
  });
});
