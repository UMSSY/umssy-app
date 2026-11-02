import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MentorSearchBar } from "./mentor-search-bar";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("MentorSearchBar", () => {
  it("muestra el placeholder y la etiqueta accesible de la HU8", () => {
    render(<MentorSearchBar value="" onSearchChange={vi.fn()} />);

    expect(
      screen.getByRole("searchbox", {
        name: "Buscar mentores por nombre",
      }),
    ).toHaveAttribute("placeholder", "Buscar por nombre");
  });

  it("actualiza la búsqueda al dejar de escribir sin presionar Enter", () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();

    render(
      <MentorSearchBar
        value=""
        onSearchChange={onSearchChange}
      />,
    );

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Buscar mentores por nombre",
      }),
      { target: { value: "Mar" } },
    );

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(onSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onSearchChange).toHaveBeenCalledWith("Mar");
  });

  it("elimina espacios de los extremos", () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();

    render(
      <MentorSearchBar value="" onSearchChange={onSearchChange} />,
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "  María  " },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearchChange).toHaveBeenLastCalledWith("María");
  });

  it("trata un texto solo con espacios como búsqueda vacía", () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();

    render(
      <MentorSearchBar value="María" onSearchChange={onSearchChange} />,
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "   " },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearchChange).toHaveBeenLastCalledWith("");
  });
});
