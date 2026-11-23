import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppointmentsPagination } from "./appointments-pagination";

afterEach(() => {
  cleanup();
});

describe("AppointmentsPagination", () => {
  it("muestra el rango, el total y la página actual", () => {
    render(
      <AppointmentsPagination
        page={1}
        pageSize={10}
        total={48}
        isDisabled={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Mostrando 1–10 de 48 citas")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 5")).toBeInTheDocument();
  });

  it("calcula el rango de la última página incompleta", () => {
    render(
      <AppointmentsPagination
        page={5}
        pageSize={10}
        total={48}
        isDisabled={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Mostrando 41–48 de 48 citas")).toBeInTheDocument();
  });

  it("deshabilita «Anterior» en la primera página", () => {
    render(
      <AppointmentsPagination
        page={1}
        pageSize={10}
        total={48}
        isDisabled={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled();
  });

  it("deshabilita «Siguiente» en la última página", () => {
    render(
      <AppointmentsPagination
        page={5}
        pageSize={10}
        total={48}
        isDisabled={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  it("deshabilita ambos botones mientras carga", () => {
    render(
      <AppointmentsPagination
        page={2}
        pageSize={10}
        total={48}
        isDisabled
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  it("notifica la página solicitada al pulsar los botones", () => {
    const onPageChange = vi.fn();

    render(
      <AppointmentsPagination
        page={2}
        pageSize={10}
        total={48}
        isDisabled={false}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(3);

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("no muestra controles con 10 citas o menos", () => {
    const { container } = render(
      <AppointmentsPagination
        page={1}
        pageSize={10}
        total={10}
        isDisabled={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("no muestra controles sin citas", () => {
    const { container } = render(
      <AppointmentsPagination
        page={1}
        pageSize={10}
        total={0}
        isDisabled={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("mantiene una distribución adaptable para pantallas estrechas", () => {
    const { container } = render(
      <AppointmentsPagination
        page={2}
        pageSize={10}
        total={48}
        isDisabled={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      container.querySelector('[aria-label="Paginación de citas"]'),
    ).toHaveClass("flex-wrap");
  });
});
