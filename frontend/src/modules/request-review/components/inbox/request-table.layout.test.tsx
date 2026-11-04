import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ReviewListItem } from "../../types/request-review.types";
import { RequestTable } from "./request-table";

const item = (overrides: Partial<ReviewListItem>): ReviewListItem => ({
  id: "id-1",
  requestCode: "SOL-1",
  fullName: "Ana Rojas",
  email: "ana@umss.test",
  sisCode: "201502277",
  career: "Licenciatura en Ingeniería de Sistemas",
  documentType: "academic_diploma",
  submittedAt: new Date().toISOString(),
  status: "pending",
  ...overrides,
});

const columnWidths = () => screen.getAllByRole("columnheader").map((header) => header.className.match(/w-\[\d+%\]/)?.[0]);

describe("RequestTable: columnas fijas", () => {
  afterEach(() => cleanup());

  it("usa una tabla de ancho fijo y cada columna tiene su ancho", () => {
    render(<RequestTable items={[item({})]} />);

    expect(screen.getByRole("table")).toHaveClass("table-fixed");
    expect(columnWidths()).toEqual(["w-[19%]", "w-[9%]", "w-[13%]", "w-[11%]", "w-[10%]", "w-[16%]", "w-[13%]", "w-[9%]"]);
  });

  it("deja partir el texto de Enviada y de la insignia de Estado, que se montaban sobre la columna vecina", () => {
    const { container } = render(
      <RequestTable items={[item({ status: "approved", validation: { result: "auto_approved", matchScore: 97, reason: null } })]} />,
    );

    expect(container.querySelector('[data-label="Enviada"]')?.className).toContain("whitespace-normal");
    expect(screen.getByText("Aprobada automáticamente").className).not.toContain("whitespace-nowrap");
  });

  it("los anchos no cambian aunque cambie el contenido de las filas", () => {
    const { rerender } = render(<RequestTable items={[item({ status: "pending" })]} />);
    const pending = columnWidths();

    rerender(
      <RequestTable
        items={[
          item({
            status: "rejected",
            fullName: "María Fernanda Quispe Mamani",
            career: "Licenciatura Ingeniería en Informática",
            validation: { result: "auto_rejected", matchScore: 12, reason: "El archivo no es un diploma" },
          }),
        ]}
      />,
    );

    expect(columnWidths()).toEqual(pending);
  });
});
