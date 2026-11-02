
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MentorDirectoryPagination } from "./mentor-directory-pagination";

afterEach(() => {
  cleanup();
});

describe("MentorDirectoryPagination", () => {
  it("muestra el contador de la primera página", () => {
    render(
      <MentorDirectoryPagination
        page={1}
        pageSize={6}
        totalItems={18}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Mostrando 1–6 de 18 mentores"),
    ).toBeInTheDocument();
  });

  it("calcula el rango de la última página incompleta", () => {
    render(
      <MentorDirectoryPagination
        page={4}
        pageSize={6}
        totalItems={20}
        totalPages={4}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Mostrando 19–20 de 20 mentores"),
    ).toBeInTheDocument();
  });

  it("muestra tres páginas alrededor de la página actual", () => {
    render(
      <MentorDirectoryPagination
        page={4}
        pageSize={6}
        totalItems={30}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Página 2" }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Página 3" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Página 4" }),
    ).toHaveAttribute("aria-current", "page");

    expect(
      screen.getByRole("button", { name: "Página 5" }),
    ).toBeInTheDocument();
  });

  it("deshabilita el botón anterior en la primera página", () => {
    render(
      <MentorDirectoryPagination
        page={1}
        pageSize={6}
        totalItems={18}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Página anterior" }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Página siguiente" }),
    ).toBeEnabled();
  });

  it("deshabilita el botón siguiente en la última página", () => {
    render(
      <MentorDirectoryPagination
        page={3}
        pageSize={6}
        totalItems={18}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Página anterior" }),
    ).toBeEnabled();

    expect(
      screen.getByRole("button", { name: "Página siguiente" }),
    ).toBeDisabled();
  });

  it("notifica el número de página solicitado", () => {
    const onPageChange = vi.fn();

    render(
      <MentorDirectoryPagination
        page={2}
        pageSize={6}
        totalItems={30}
        totalPages={5}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Página 3" }));

    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(3);
  });

  it("no ejecuta onPageChange al pulsar la página activa", () => {
    const onPageChange = vi.fn();

    render(
      <MentorDirectoryPagination
        page={2}
        pageSize={6}
        totalItems={30}
        totalPages={5}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("muestra solamente la página 1 cuando existe una sola página", () => {
    render(
      <MentorDirectoryPagination
        page={1}
        pageSize={6}
        totalItems={4}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Página 1" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Página anterior" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Página siguiente" }),
    ).not.toBeInTheDocument();
  });

  it("no muestra paginación cuando no hay mentores", () => {
    const { container } = render(
      <MentorDirectoryPagination
        page={1}
        pageSize={6}
        totalItems={0}
        totalPages={0}
        onPageChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("mantiene una distribución adaptable para pantallas estrechas", () => {
    const { container } = render(
      <MentorDirectoryPagination
        page={2}
        pageSize={6}
        totalItems={30}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      container.querySelector(
        '[aria-label="Paginación del directorio de mentores"]',
      ),
    ).toHaveClass("flex-col");

    expect(container.querySelector(".flex-wrap")).toBeInTheDocument();
  });
});
