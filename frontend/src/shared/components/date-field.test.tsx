import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateField } from "./date-field";

afterEach(cleanup);

describe("DateField", () => {
  it("displays an ISO date as day/month/year independently of browser locale", () => {
    const { rerender } = render(<DateField aria-label="Fecha" value="2026-03-08" />);
    expect(screen.getByRole("textbox", { name: "Fecha" })).toHaveValue("08/03/2026");
    rerender(<DateField aria-label="Fecha" value="2025-12-31" />);
    expect(screen.getByRole("textbox", { name: "Fecha" })).toHaveValue("31/12/2025");
  });

  it("keeps partial input visible and sends valid dates in ISO and retains invalid text for domain validation", async () => {
    const onChange = vi.fn();
    function ControlledDate() {
      const [value, setValue] = useState("");
      return <DateField aria-label="Fecha" value={value} onValueChange={(next) => { setValue(next); onChange(next); }} />;
    }
    const user = userEvent.setup();
    render(<ControlledDate />);
    const input = screen.getByRole("textbox", { name: "Fecha" });
    await user.type(input, "3112");
    expect(input).toHaveValue("31/12/");
    expect(onChange).toHaveBeenLastCalledWith("31/12/");
    await user.type(input, "2026");
    expect(input).toHaveValue("31/12/2026");
    expect(onChange).toHaveBeenLastCalledWith("2026-12-31");
    fireEvent.change(input, { target: { value: "31/02/2026" } });
    expect(input).toHaveValue("31/02/2026");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(onChange).toHaveBeenLastCalledWith("31/02/2026");
  });
  it("inserts separators and deletes across them without trapping the cursor", async () => {
    const onChange = vi.fn();
    function ControlledDate() {
      const [value, setValue] = useState("");
      return <DateField aria-label="Fecha" value={value} onValueChange={(next) => { setValue(next); onChange(next); }} />;
    }
    const user = userEvent.setup();
    render(<ControlledDate />);
    const input = screen.getByRole("textbox", { name: "Fecha" });
    await user.type(input, "02");
    expect(input).toHaveValue("02/");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("0");
    await user.type(input, "2022002");
    expect(input).toHaveValue("02/02/2002");
    expect(onChange).toHaveBeenLastCalledWith("2002-02-02");
    await user.clear(input);
    await user.paste("15/10/2026");
    expect(input).toHaveValue("15/10/2026");
    expect(onChange).toHaveBeenLastCalledWith("2026-10-15");
  });

  it("selects a date in the Spanish calendar and returns the ISO value", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<DateField aria-label="Fecha" value="2026-03-08" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Elegir fecha en el calendario" }));
    const dialog = await screen.findByRole("dialog", { name: "Seleccionar fecha" });
    await user.click(within(dialog).getByRole("button", { name: /15 de marzo de 2026/i }));
    expect(onValueChange).toHaveBeenCalledWith("2026-03-15");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

});
