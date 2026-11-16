import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VacancyDates } from "./vacancy-dates";

afterEach(cleanup);

describe("VacancyDates", () => {
  it("muestra las fechas en horario boliviano y conserva el instante original", () => {
    render(<VacancyDates publishedAt="2026-11-11T02:00:00.000Z" expiresAt="2026-11-26T02:00:00.000Z" />);
    expect(screen.getByText("10/11/2026")).toHaveAttribute("dateTime", "2026-11-11T02:00:00.000Z");
    expect(screen.getByText("25/11/2026")).toBeInTheDocument();
  });
  it("explica cuando no hay vencimiento y tolera fechas inválidas", () => {
    render(<VacancyDates publishedAt="invalida" expiresAt={null} />);
    expect(screen.getByText("No disponible")).toBeInTheDocument();
    expect(screen.getByText("Sin fecha de vencimiento")).toBeInTheDocument();
  });
});
