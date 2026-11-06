
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/shared/services/query-client";
import { afterEach, describe, expect, it, vi } from "vitest";
import ColaRevisionPage from "./page";

vi.mock("@/modules/radar-chart/services/radar-integration.service", () => ({
  radarIntegrationApi: {
    reviews: vi.fn().mockResolvedValue([]),
    decision: vi.fn(),
    adminReprocessCv: vi.fn(),
  },
}));

function renderQueuePage() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <ColaRevisionPage />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("ColaRevisionPage", () => {
  it("renders the persistent review queue", async () => {
    renderQueuePage();

    expect(
      screen.getByRole("heading", {
        name: "Revisión documental y de radares",
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText("No hay elementos en esta categoría."),
    ).toBeInTheDocument();
  });

  it("offers the current document review filters", () => {
    renderQueuePage();

    for (const name of ["Pendientes", "Aprobados", "Rechazados", "Todos"]) {
      expect(
        screen.getByRole("button", { name }),
      ).toBeInTheDocument();
    }
  });
});
