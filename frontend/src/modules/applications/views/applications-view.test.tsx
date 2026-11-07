import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "@/hooks/use-mobile";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { applicationService } from "../services/application.service";
import { buildApplication } from "../testing/application-fixtures";
import { ApplicationsView } from "./applications-view";

vi.mock("../services/application.service", () => ({
  applicationService: { getMine: vi.fn(), withdraw: vi.fn() },
}));

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: vi.fn() }));

const getMine = vi.mocked(applicationService.getMine);
const withdraw = vi.mocked(applicationService.withdraw);
const isMobile = vi.mocked(useIsMobile);

const APPLICATIONS = [
  buildApplication({ id: "a", vacancyTitle: "Backend Java", companyName: "Nube Andina", affinityPercentage: 50 }),
  buildApplication({
    id: "b",
    vacancyTitle: "Analista de datos",
    companyName: "Datos Aurora",
    affinityPercentage: 100,
    status: "Entrevista",
  }),
  buildApplication({
    id: "c",
    vacancyTitle: "Frontend React",
    companyName: "Vector Sur",
    affinityPercentage: 25,
    status: "Retirada",
  }),
];

function vacancyColumn() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);
}

beforeEach(() => {
  vi.clearAllMocks();
  isMobile.mockReturnValue(false);
});

afterEach(cleanup);

describe("ApplicationsView", () => {
  it("shows a placeholder while the applications are loading", () => {
    getMine.mockReturnValue(new Promise(() => undefined));

    const { container } = renderWithQuery(<ApplicationsView />);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it("lists the applications returned by the server", async () => {
    getMine.mockResolvedValue([buildApplication()]);

    renderWithQuery(<ApplicationsView />);

    expect(await screen.findByText("TechBolivia S.R.L.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mis postulaciones" })).toBeInTheDocument();
  });

  it("invites the person to explore vacancies when there are no applications", async () => {
    getMine.mockResolvedValue([]);

    renderWithQuery(<ApplicationsView />);

    expect(await screen.findByText("Todavía no te postulaste a ninguna vacante")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explorar vacantes" })).toHaveAttribute("href", "/vacancies");
  });

  it("shows an error and lets the person retry", async () => {
    getMine.mockRejectedValueOnce(new Error("Network Error"));
    getMine.mockResolvedValueOnce([buildApplication()]);

    renderWithQuery(<ApplicationsView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar tus postulaciones");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("TechBolivia S.R.L.")).toBeInTheDocument();
  });

  it("asks for confirmation and withdraws the application only after confirming", async () => {
    getMine.mockResolvedValueOnce([buildApplication({ id: "application-7" })]);
    getMine.mockResolvedValueOnce([]);
    withdraw.mockResolvedValue(undefined);

    renderWithQuery(<ApplicationsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Retirar" }));

    expect(await screen.findByRole("alertdialog", { name: "¿Retirar tu postulación?" })).toBeInTheDocument();
    expect(withdraw).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Sí, retirar" }));

    await waitFor(() => expect(withdraw).toHaveBeenCalledWith("application-7"));
    expect(await screen.findByText("Todavía no te postulaste a ninguna vacante")).toBeInTheDocument();
  });

  it("keeps the application when the person cancels the withdrawal", async () => {
    getMine.mockResolvedValue([buildApplication({ id: "application-7" })]);

    renderWithQuery(<ApplicationsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Retirar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(withdraw).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Retirar" })).toBeEnabled();
  });

  it("sorts by a column and toggles the direction on a second click", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    fireEvent.click(screen.getByRole("button", { name: "Afinidad" }));
    expect(vacancyColumn()).toEqual(["Frontend React", "Backend Java", "Analista de datos"]);
    expect(screen.getByRole("columnheader", { name: "Afinidad" })).toHaveAttribute("aria-sort", "ascending");

    fireEvent.click(screen.getByRole("button", { name: "Afinidad" }));
    expect(vacancyColumn()).toEqual(["Analista de datos", "Backend Java", "Frontend React"]);
    expect(screen.getByRole("columnheader", { name: "Afinidad" })).toHaveAttribute("aria-sort", "descending");

    fireEvent.click(screen.getByRole("button", { name: "Empresa" }));
    expect(vacancyColumn()).toEqual(["Analista de datos", "Backend Java", "Frontend React"]);
  });

  it("filters the applications with the status tabs", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    fireEvent.click(screen.getByRole("tab", { name: "Entrevista" }));
    expect(vacancyColumn()).toEqual(["Analista de datos"]);

    fireEvent.click(screen.getByRole("tab", { name: "Aceptada" }));
    expect(screen.getByText("No tienes postulaciones en este estado.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Todas" }));
    expect(vacancyColumn()).toHaveLength(3);
  });

  it("shows cards instead of the table on mobile", async () => {
    isMobile.mockReturnValue(true);
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);

    expect(await screen.findByText("Backend Java")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "En revisión" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
