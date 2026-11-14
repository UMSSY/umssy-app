
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  buildApplication({
    id: "a",
    vacancyTitle: "Backend Java",
    companyName: "Nube Andina",
    affinityPercentage: 50,
  }),
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
    .map((row) =>
      within(row).getAllByRole("cell")[0].textContent?.trim(),
    );
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
    expect(
      screen.getByRole("heading", { name: "Mis postulaciones" }),
    ).toBeInTheDocument();
  });

  it("invites the person to explore vacancies when there are no applications", async () => {
    getMine.mockResolvedValue([]);

    renderWithQuery(<ApplicationsView />);

    expect(
      await screen.findByText(
        "Todavía no te postulaste a ninguna vacante",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Explorar vacantes" }),
    ).toHaveAttribute("href", "/vacancies");
  });

  it("shows an error and lets the person retry", async () => {
    getMine.mockRejectedValueOnce(new Error("Network Error"));
    getMine.mockResolvedValueOnce([buildApplication()]);

    renderWithQuery(<ApplicationsView />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos cargar tus postulaciones",
    );

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("TechBolivia S.R.L.")).toBeInTheDocument();
  });

  it("asks for confirmation and withdraws the application only after confirming", async () => {
    getMine.mockResolvedValueOnce([
      buildApplication({ id: "application-7" }),
    ]);
    getMine.mockResolvedValueOnce([]);
    withdraw.mockResolvedValue(undefined);

    renderWithQuery(<ApplicationsView />);

    fireEvent.click(await screen.findByRole("button", { name: "Retirar" }));

    expect(
      await screen.findByRole("alertdialog", {
        name: "¿Retirar tu postulación?",
      }),
    ).toBeInTheDocument();

    expect(withdraw).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Sí, retirar" }));

    await waitFor(() =>
      expect(withdraw).toHaveBeenCalledWith("application-7"),
    );

    expect(
      await screen.findByText(
        "Todavía no te postulaste a ninguna vacante",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the application when the person cancels the withdrawal", async () => {
    getMine.mockResolvedValue([buildApplication({ id: "application-7" })]);

    renderWithQuery(<ApplicationsView />);

    fireEvent.click(await screen.findByRole("button", { name: "Retirar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );

    expect(withdraw).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Retirar" })).toBeEnabled();
  });

  it("sorts affinity from lowest to highest using the dropdown", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    await userEvent.click(
      screen.getByRole("combobox", { name: "Ordenar postulaciones" }),
    );
    await userEvent.click(
      screen.getByRole("option", {
        name: "Afinidad (menor a mayor)",
      }),
    );

    expect(vacancyColumn()).toEqual([
      "Backend Java",
      "Analista de datos",
    ]);
  });

  it("sorts affinity from highest to lowest using the dropdown", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    await userEvent.click(
      screen.getByRole("combobox", { name: "Ordenar postulaciones" }),
    );
    await userEvent.click(
      screen.getByRole("option", {
        name: "Afinidad (mayor a menor)",
      }),
    );

    expect(vacancyColumn()).toEqual([
      "Analista de datos",
      "Backend Java",
    ]);
  });

  it("sorts companies alphabetically using the dropdown", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    await userEvent.click(
      screen.getByRole("combobox", { name: "Ordenar postulaciones" }),
    );
    await userEvent.click(
      screen.getByRole("option", { name: "Empresa (A-Z)" }),
    );

    expect(vacancyColumn()).toEqual([
      "Analista de datos",
      "Backend Java",
    ]);
  });

  it("filters the applications with the status tabs", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    fireEvent.click(screen.getByRole("tab", { name: "Entrevista" }));

    expect(vacancyColumn()).toEqual(["Analista de datos"]);

    fireEvent.click(screen.getByRole("tab", { name: "Aceptada" }));

    expect(
      screen.getByText("No tienes postulaciones en este estado."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Todas" }));

    expect(vacancyColumn()).toHaveLength(2);
  });

  it("shows cards instead of the table on mobile", async () => {
    isMobile.mockReturnValue(true);
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);

    expect(await screen.findByText("Backend Java")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "En revisión" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("hides the withdrawn applications until the person turns the switch on", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    expect(vacancyColumn()).toEqual([
      "Analista de datos",
      "Backend Java",
    ]);

    expect(
      screen.queryByRole("tab", { name: "Retirada" }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("switch", {
        name: "Mostrar postulaciones retiradas (1)",
      }),
    );

    await waitFor(() =>
      expect(vacancyColumn()).toEqual([
        "Analista de datos",
        "Backend Java",
        "Frontend React",
      ]),
    );

    fireEvent.click(
      await screen.findByRole("tab", { name: "Retirada" }),
    );

    expect(vacancyColumn()).toEqual(["Frontend React"]);
  });

  it("goes back to all the applications when the withdrawn ones are hidden again", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    await userEvent.click(
      screen.getByRole("switch", {
        name: "Mostrar postulaciones retiradas (1)",
      }),
    );

    fireEvent.click(
      await screen.findByRole("tab", { name: "Retirada" }),
    );

    await userEvent.click(
      screen.getByRole("switch", {
        name: "Mostrar postulaciones retiradas (1)",
      }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("tab", { name: "Retirada" }),
      ).not.toBeInTheDocument(),
    );

    expect(vacancyColumn()).toEqual([
      "Analista de datos",
      "Backend Java",
    ]);
  });

  it("does not offer the switch when there are no withdrawn applications", async () => {
    getMine.mockResolvedValue([buildApplication()]);

    renderWithQuery(<ApplicationsView />);

    expect(await screen.findByText("TechBolivia S.R.L.")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("explains that there are no active applications when all of them are withdrawn", async () => {
    getMine.mockResolvedValue([
      buildApplication({ status: "Retirada" }),
    ]);

    renderWithQuery(<ApplicationsView />);

    expect(
      await screen.findByText("No tienes postulaciones activas."),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Todavía no te postulaste a ninguna vacante",
      ),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("switch", {
        name: "Mostrar postulaciones retiradas (1)",
      }),
    );

    expect(
      await screen.findByText(
        "Desarrollador Backend Python / FastAPI",
      ),
    ).toBeInTheDocument();
  });

  it("disables the withdraw button of the applications that already have a decision", async () => {
    getMine.mockResolvedValue([
      buildApplication({
        id: "accepted",
        vacancyTitle: "Aceptada",
        status: "Aceptada",
      }),
      buildApplication({
        id: "rejected",
        vacancyTitle: "Rechazada",
        status: "No seleccionado",
      }),
    ]);

    renderWithQuery(<ApplicationsView />);

    const buttons = await screen.findAllByRole("button", {
      name: "Retirar",
    });

    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => expect(button).toBeDisabled());

    fireEvent.click(buttons[0]);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(withdraw).not.toHaveBeenCalled();
  });
});
