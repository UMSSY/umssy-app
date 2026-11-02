import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ColaRevisionPage from "./page";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
function renderPage(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
  return render(<QueryClientProvider client={client}><ColaRevisionPage/></QueryClientProvider>);}


vi.mock("@/modules/radar-chart/services/radar-integration.service", () => ({ radarIntegrationApi: { reviews: vi.fn().mockResolvedValue([]) } }));
afterEach(cleanup);

describe("ColaRevisionPage", () => {
  it("renders the persistent review queue", async () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Revisión documental y de radares" })).toBeInTheDocument();
    expect(await screen.findByText("No hay elementos en esta categoría.")).toBeInTheDocument();
  });
  it("offers the current document review filters", () => {
    renderPage();
    for (const name of ["Pendientes", "Aprobados", "Rechazados", "Todos"]) expect(screen.getByRole("button", { name })).toBeInTheDocument();
  });
});