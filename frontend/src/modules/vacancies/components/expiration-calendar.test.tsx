import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExpirationCalendar } from "./expiration-calendar";

const TODAY = new Date(2026, 10, 15); // 15 de noviembre de 2026

afterEach(() => {
  cleanup();
});

describe("ExpirationCalendar", () => {
  it("muestra el mes en español", () => {
    render(<ExpirationCalendar onSelect={vi.fn()} today={TODAY} />);
    expect(screen.getByText(/noviembre 2026/i)).toBeInTheDocument();
  });

  it("empieza la semana en lunes", () => {
    render(<ExpirationCalendar onSelect={vi.fn()} today={TODAY} />);
    const headers = screen.getAllByRole("columnheader", { hidden: true });
    expect(headers[0]).toHaveAttribute("aria-label", "lunes");
  });

  it("no permite elegir hoy ni días pasados", async () => {
    const onSelect = vi.fn();
    render(<ExpirationCalendar onSelect={onSelect} today={TODAY} />);

    const today = screen.getByRole("button", { name: /15 de noviembre/i });
    const pastDay = screen.getByRole("button", { name: /10 de noviembre/i });

    expect(today).toBeDisabled();
    expect(pastDay).toBeDisabled();

    await userEvent.click(today);
    await userEvent.click(pastDay);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("permite elegir un día futuro", async () => {
    const onSelect = vi.fn();
    render(<ExpirationCalendar onSelect={onSelect} today={TODAY} />);

    await userEvent.click(screen.getByRole("button", { name: /20 de noviembre/i }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    const picked: Date = onSelect.mock.calls[0][0];
    expect(picked.getDate()).toBe(20);
  });
});