import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getVisibleRange, ReportTableFooter } from "./report-table-footer";

function renderFooter(props: Partial<Parameters<typeof ReportTableFooter>[0]> = {}) {
  const handlers = { onPageChange: vi.fn(), onRefresh: vi.fn() };

  render(
    <ReportTableFooter currentPage={1} totalItems={11} totalPages={2} isLoading={false} {...handlers} {...props} />,
  );

  return handlers;
}

describe("getVisibleRange", () => {
  it.each([
    { page: 1, total: 0, expected: { first: 0, last: 0 } },
    { page: 1, total: 10, expected: { first: 1, last: 10 } },
    { page: 1, total: 11, expected: { first: 1, last: 10 } },
    { page: 2, total: 11, expected: { first: 11, last: 11 } },
    { page: 3, total: 24, expected: { first: 21, last: 24 } },
  ])("página $page de $total registros", ({ page, total, expected }) => {
    expect(getVisibleRange(page, total)).toEqual(expected);
  });
});

describe("ReportTableFooter", () => {
  afterEach(cleanup);

  it("muestra el rango visible y los botones de página", () => {
    renderFooter({ currentPage: 2 });

    expect(screen.getByText("Mostrando 11-11 de 11 usuarios")).toBeDefined();
    expect(screen.getByRole("button", { name: "Página 2" }).getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("button", { name: "Página 3" })).toBeNull();
  });

  it("muestra el estado de carga y desactiva el botón de actualizar", () => {
    renderFooter({ isLoading: true, refreshLabel: "Actualizar" });

    expect(screen.getByText("Cargando usuarios...")).toBeDefined();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Actualizar" }).disabled).toBe(true);
  });

  it("avisa el cambio de página y la actualización", () => {
    const { onPageChange, onRefresh } = renderFooter();

    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    fireEvent.click(screen.getByRole("button", { name: "actualizar" }));

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("oculta el paginador cuando el filtro no tiene resultados", () => {
    renderFooter({ totalItems: 0, totalPages: 1 });

    expect(screen.getByText("Mostrando 0-0 de 0 usuarios")).toBeDefined();
    expect(screen.queryByRole("navigation", { name: "Paginación" })).toBeNull();
  });

  it("oculta el contador y deja la página 1 cuando no hay resultados en el modo hide-summary", () => {
    renderFooter({ totalItems: 0, totalPages: 1, emptyResultsMode: "hide-summary" });

    expect(screen.queryByText(/^Mostrando/)).toBeNull();
    expect(screen.getByRole("button", { name: "Página 1" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Página siguiente" }).disabled).toBe(true);
  });

  it("mantiene el paginador mientras carga", () => {
    renderFooter({ totalItems: 0, totalPages: 1, isLoading: true });

    expect(screen.getByRole("navigation", { name: "Paginación" })).toBeDefined();
  });

  it("deshabilita Anterior en la primera página y Siguiente en la última", () => {
    renderFooter({ currentPage: 1, totalItems: 25, totalPages: 3 });
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Página anterior" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Página siguiente" }).disabled).toBe(false);
    cleanup();

    renderFooter({ currentPage: 3, totalItems: 25, totalPages: 3 });
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Página anterior" }).disabled).toBe(false);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Página siguiente" }).disabled).toBe(true);
  });

  it("muestra elipsis cuando hay muchas páginas", () => {
    renderFooter({ currentPage: 10, totalItems: 200, totalPages: 20 });

    expect(screen.getAllByTestId("pagination-ellipsis")).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: /^Página \d+$/ }).map((button) => button.textContent),
    ).toEqual(["1", "9", "10", "11", "20"]);
  });
});
