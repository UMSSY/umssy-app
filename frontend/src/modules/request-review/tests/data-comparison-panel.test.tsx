import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataComparisonPanel } from "../components/data-comparison-panel";
import type { ComparisonField } from "../types/data-comparison-props";

afterEach(cleanup);

const SAMPLE_FIELDS: ComparisonField[] = [
  {
    id: "full-name",
    label: "Nombres y apellidos",
    declaredValue: "Ana Pérez",
    documentValue: "  ANA   PÉREZ  ",
  },
  {
    id: "identity-number",
    label: "Carnet",
    declaredValue: "1234567",
    documentValue: "",
  },
  {
    id: "sis-code",
    label: "Código SIS",
    declaredValue: "202012345",
    documentValue: "202012346",
  },
];

describe("DataComparisonPanel", () => {
  it("muestra los valores declarados y del documento", () => {
    render(<DataComparisonPanel fields={SAMPLE_FIELDS} />);

    expect(
      screen.getByRole("heading", { name: "Contraste de datos" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("ANA PÉREZ")).toBeInTheDocument();
    expect(screen.getByText("1234567")).toBeInTheDocument();
    expect(screen.getByText("202012345")).toBeInTheDocument();
    expect(screen.getByText("202012346")).toBeInTheDocument();
    expect(screen.getByText("Sin valor registrado")).toBeInTheDocument();
  });

  it("indica coincidencias y valores por verificar con su resumen", () => {
    render(<DataComparisonPanel fields={SAMPLE_FIELDS} />);

    expect(screen.getAllByText("Coincide")).toHaveLength(1);
    expect(screen.getAllByText("Por verificar")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 coinciden · 2 por verificar",
    );
  });

  it("mantiene por verificar los campos vacíos y las diferencias en tildes", () => {
    render(
      <DataComparisonPanel
        fields={[
          {
            id: "empty",
            label: "Carrera",
            declaredValue: "",
            documentValue: "",
          },
          {
            id: "surname",
            label: "Apellido",
            declaredValue: "Pérez",
            documentValue: "Perez",
          },
          {
            id: "missing-declared",
            label: "Año de titulación",
            declaredValue: "",
            documentValue: "2024",
          },
        ]}
      />,
    );

    expect(screen.queryByText("Coincide")).not.toBeInTheDocument();
    expect(screen.getAllByText("Por verificar")).toHaveLength(3);
    expect(screen.getAllByText("Sin dato declarado")).toHaveLength(2);
  });

  it("muestra un estado vacío cuando no recibe campos", () => {
    render(<DataComparisonPanel fields={[]} />);

    expect(
      screen.getByText("No hay datos disponibles para contrastar."),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "0 coinciden · 0 por verificar",
    );
  });

  it("permite editar y comunica el campo y su nuevo valor", async () => {
    const user = userEvent.setup();
    const handleDocumentValueChange = vi.fn();

    render(
      <DataComparisonPanel
        fields={[SAMPLE_FIELDS[1]]}
        isEditable
        onDocumentValueChange={handleDocumentValueChange}
      />,
    );

    const input = screen.getByRole("textbox", {
      name: "Carnet en el documento",
    });

    await user.type(input, "7");

    expect(handleDocumentValueChange).toHaveBeenCalledWith(
      "identity-number",
      "7",
    );
  });

  it("actualiza el resumen cuando recibe valores corregidos", () => {
    const { rerender } = render(
      <DataComparisonPanel fields={[SAMPLE_FIELDS[1]]} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "0 coinciden · 1 por verificar",
    );

    rerender(
      <DataComparisonPanel
        fields={[
          {
            ...SAMPLE_FIELDS[1],
            documentValue: "1234567",
          },
        ]}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "1 coinciden · 0 por verificar",
    );
  });

  it("mantiene la lectura cuando falta la función de actualización", () => {
    render(
      <DataComparisonPanel fields={SAMPLE_FIELDS} isEditable />,
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
  });

  it("mantiene la lectura cuando la edición está desactivada", () => {
    render(
      <DataComparisonPanel
        fields={SAMPLE_FIELDS}
        isEditable={false}
        onDocumentValueChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});