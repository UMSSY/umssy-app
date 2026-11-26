import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildVacancy } from "../testing/vacancy-fixtures";
import { VacancyDetailDialog } from "./vacancy-detail-dialog";

afterEach(cleanup);

describe("VacancyDetailDialog - fechas", () => {
  it("muestra la fecha de publicación y la de expiración de la vacante", () => {
    render(
      <VacancyDetailDialog
        vacancy={buildVacancy({ publishedAt: "2026-11-10T15:00:00.000Z", expiresAt: "2026-12-10T15:00:00.000Z" })}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Publicado").closest("div")).toHaveTextContent("10/11/2026");
    expect(screen.getByText("Expira").closest("div")).toHaveTextContent("10/12/2026");
  });

  it("avisa cuando la vacante no tiene fecha de expiración", () => {
    render(<VacancyDetailDialog vacancy={buildVacancy({ expiresAt: null })} onClose={vi.fn()} />);

    expect(screen.getByText("Sin fecha de expiración")).toBeInTheDocument();
  });
});
