import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppointmentsSearchBar } from "./appointments-search-bar";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AppointmentsSearchBar", () => {
  it("muestra el placeholder y la etiqueta accesible", () => {
    render(<AppointmentsSearchBar value="" onSearchChange={vi.fn()} />);

    expect(
      screen.getByRole("searchbox", { name: "Buscar citas por nombre" }),
    ).toHaveAttribute("placeholder", "Buscar por nombre");
  });

  it("limita el texto al largo máximo que acepta el backend", () => {
    render(<AppointmentsSearchBar value="" onSearchChange={vi.fn()} />);

    expect(screen.getByRole("searchbox")).toHaveAttribute("maxLength", "100");
  });

  it("actualiza la búsqueda al dejar de escribir sin presionar Enter", () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();

    render(<AppointmentsSearchBar value="" onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Ana" },
    });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(onSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onSearchChange).toHaveBeenCalledWith("Ana");
  });

  it("sincroniza el valor externo sin perder el foco", () => {
    const { rerender } = render(
      <AppointmentsSearchBar value="" onSearchChange={vi.fn()} />,
    );
    const input = screen.getByRole("searchbox");

    input.focus();
    fireEvent.change(input, { target: { value: "Lu" } });
    rerender(<AppointmentsSearchBar value="Lu" onSearchChange={vi.fn()} />);

    expect(input).toHaveFocus();
    expect(input).toHaveValue("Lu");
  });

  it("limpia el texto externo sin restaurar la búsqueda anterior", () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();

    const { rerender } = render(
      <AppointmentsSearchBar value="" onSearchChange={onSearchChange} />,
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Ana Pérez" },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearchChange).toHaveBeenCalledWith("Ana Pérez");

    rerender(
      <AppointmentsSearchBar value="Ana Pérez" onSearchChange={onSearchChange} />,
    );

    onSearchChange.mockClear();

    rerender(<AppointmentsSearchBar value="" onSearchChange={onSearchChange} />);

    expect(screen.getByRole("searchbox")).toHaveValue("");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearchChange).not.toHaveBeenCalled();
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("elimina espacios de los extremos", () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();

    render(<AppointmentsSearchBar value="" onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "  Ana  " },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearchChange).toHaveBeenLastCalledWith("Ana");
  });

  it("trata un texto solo con espacios como búsqueda vacía", () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();

    render(<AppointmentsSearchBar value="Ana" onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "   " },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearchChange).toHaveBeenLastCalledWith("");
  });
});
