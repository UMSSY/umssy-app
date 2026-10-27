import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { VacancyHistoryView } from "./vacancy-history-view";

vi.mock("../components/vacancy-list", () => ({
  VacancyList: ({ scope }: { scope?: string }) => <div data-testid="vacancy-list">{scope}</div>,
}));

describe("VacancyHistoryView", () => {
  afterEach(() => cleanup());

  it("muestra el título y renderiza la lista en modo historial", () => {
    renderWithQuery(<VacancyHistoryView />);

    expect(screen.getByRole("heading", { name: "Historial de vacantes" })).toBeInTheDocument();
    expect(screen.getByTestId("vacancy-list")).toHaveTextContent("history");
  });
});