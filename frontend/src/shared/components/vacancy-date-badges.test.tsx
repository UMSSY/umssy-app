import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VacancyDateBadges } from "./vacancy-date-badges";

afterEach(cleanup);

describe("VacancyDateBadges", () => {
  it("muestra la fecha de publicación y la de expiración en hora de Bolivia", () => {
    render(<VacancyDateBadges publishedAt="2026-11-10T15:00:00.000Z" expiresAt="2026-11-29T03:00:00.000Z" />);

    expect(screen.getByText("Publicado: 10/11/2026")).toBeInTheDocument();
    expect(screen.getByText("Expira: 28/11/2026")).toBeInTheDocument();
  });

  it("no muestra la expiración cuando la vacante no vence", () => {
    render(<VacancyDateBadges publishedAt="2026-11-10T15:00:00.000Z" expiresAt={null} />);

    expect(screen.getByText("Publicado: 10/11/2026")).toBeInTheDocument();
    expect(screen.queryByText(/Expira/)).toBeNull();
  });

  it("agrupa las fechas en una lista accesible", () => {
    render(<VacancyDateBadges publishedAt="2026-11-10T15:00:00.000Z" expiresAt="2026-11-29T15:00:00.000Z" />);

    expect(screen.getByRole("list", { name: "Fechas de la vacante" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
