import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ReviewListItem } from "../../types/request-review.types";
import { RequestTable } from "./request-table";

const item: ReviewListItem = {
  id: "id-1",
  requestCode: "SOL-1",
  fullName: "Ana Rojas",
  email: "ana@umss.test",
  sisCode: "201502277",
  career: "Licenciatura en Ingeniería de Sistemas",
  documentType: "academic_diploma",
  submittedAt: new Date().toISOString(),
  status: "pending",
  validation: { result: "manual_review", matchScore: 61, reason: "El apellido no coincide" },
};

describe("RequestTable: tarjetas en celular", () => {
  afterEach(() => cleanup());

  it("en celular oculta los encabezados y cada fila se muestra como tarjeta", () => {
    render(<RequestTable items={[item]} />);

    expect(screen.getAllByRole("rowgroup")[0]).toHaveClass("max-md:hidden");
    expect(screen.getAllByRole("row")[1]).toHaveClass("max-md:grid", "max-md:grid-cols-2");
  });

  it("cada dato de la tarjeta lleva el nombre de su columna, incluida la coincidencia", () => {
    render(<RequestTable items={[item]} />);

    const cells = within(screen.getAllByRole("row")[1]).getAllByRole("cell");
    const labels = cells.map((cell) => cell.getAttribute("data-label"));
    expect(labels).toEqual([null, "Código SIS", "Carrera", "Documento", "Enviada", "Estado", "Coincidencia", null]);
    expect(screen.getByText("El apellido no coincide")).toBeInTheDocument();
  });

  it("el botón Revisar ocupa todo el ancho en celular", () => {
    render(<RequestTable items={[item]} />);

    expect(screen.getByRole("link", { name: "Revisar" })).toHaveClass("max-md:w-full");
  });
});
