import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ColaRevisionPage from "./page";

vi.mock("@/modules/radar-chart/sprint2-integration/radar-integration-api", () => ({ radarIntegrationApi: { reviews: vi.fn().mockResolvedValue([]) } }));
afterEach(cleanup);

describe("ColaRevisionPage", () => {
  it("renders the persistent review queue", async () => {
    render(<ColaRevisionPage />);
    expect(screen.getByRole("heading", { name: "Revisión documental y de radares" })).toBeInTheDocument();
    expect(await screen.findByText("No hay elementos en esta categoría.")).toBeInTheDocument();
  });
  it("offers the current document review filters", () => {
    render(<ColaRevisionPage />);
    for (const name of ["Pendientes", "Aprobados", "Rechazados", "Todos"]) expect(screen.getByRole("button", { name })).toBeInTheDocument();
  });
});