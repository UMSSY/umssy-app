import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildApplication } from "../testing/application-fixtures";
import { ViewVacancyLink } from "./view-vacancy-link";

afterEach(cleanup);

describe("ViewVacancyLink", () => {
  it("opens the detail of the vacancy the person applied to", () => {
    render(<ViewVacancyLink application={buildApplication({ jobOfferId: "offer-9" })} />);

    expect(screen.getByRole("link", { name: /^Ver vacante/ })).toHaveAttribute("href", "/vacancies/offer-9");
  });

  it("names the vacancy so several links in a list can be told apart", () => {
    render(<ViewVacancyLink application={buildApplication({ vacancyTitle: "Analista de Datos" })} />);

    expect(screen.getByRole("link", { name: "Ver vacante: Analista de Datos" })).toBeInTheDocument();
  });

  it.each(["En revisión", "Entrevista", "Aceptada", "No seleccionado", "Retirada"] as const)(
    "is available when the application status is %s",
    (status) => {
      render(<ViewVacancyLink application={buildApplication({ status })} />);

      expect(screen.getByRole("link", { name: /^Ver vacante/ })).toBeInTheDocument();
    },
  );
});
