import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { applicationService } from "../services/application.service";
import { buildApplication } from "../testing/application-fixtures";
import { ApplicationsView } from "./applications-view";

vi.mock("../services/application.service", () => ({
  applicationService: { getMine: vi.fn(), withdraw: vi.fn() },
}));

const getMine = vi.mocked(applicationService.getMine);
const withdraw = vi.mocked(applicationService.withdraw);

beforeEach(() => {
  vi.clearAllMocks();
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

  it("withdraws an application and reloads the list from the server", async () => {
    getMine.mockResolvedValueOnce([buildApplication({ id: "application-7" })]);
    getMine.mockResolvedValueOnce([]);
    withdraw.mockResolvedValue(undefined);

    renderWithQuery(<ApplicationsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Retirar" }));

    await waitFor(() => expect(withdraw).toHaveBeenCalledWith("application-7"));
    expect(await screen.findByText("Todavía no te postulaste a ninguna vacante")).toBeInTheDocument();
  });
});
