import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "@/hooks/use-mobile";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { toast } from "sonner";
import { applicationService } from "../services/application.service";
import { buildApplication } from "../testing/application-fixtures";
import { ApplicationsView } from "./applications-view";

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("../services/application.service", () => ({
  applicationService: { getMine: vi.fn(), withdraw: vi.fn(), reactivate: vi.fn(), getContact: vi.fn() },
}));

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: vi.fn() }));

const getMine = vi.mocked(applicationService.getMine);
const withdraw = vi.mocked(applicationService.withdraw);
const reactivate = vi.mocked(applicationService.reactivate);
const getContact = vi.mocked(applicationService.getContact);
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

const CONTACT = {
  applicationId: "application-7",
  jobOfferId: "offer-1",
  vacancyTitle: "Desarrollador Backend Python / FastAPI",
  companyId: "company-1",
  companyName: "TechBolivia S.R.L.",
  recruiters: [{ id: "recruiter-1", fullName: "Ana Rojas" }],
};

function vacancyColumn() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].querySelector("p")?.textContent);
}

async function selectStatus(option: string) {
  await userEvent.click(screen.getByRole("combobox", { name: "Mostrar:" }));
  await userEvent.click(await screen.findByRole("option", { name: option }));
  await waitFor(() => expect(screen.queryByRole("option")).not.toBeInTheDocument());
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

  it("shows the failure with a retry button and withdraws again when the person retries", async () => {
    getMine.mockResolvedValue([buildApplication({ id: "application-7" })]);
    withdraw.mockRejectedValueOnce(new Error("Network Error"));
    withdraw.mockResolvedValueOnce(undefined);

    renderWithQuery(<ApplicationsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Retirar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sí, retirar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No pudimos retirar la postulación. Intenta nuevamente.");
    fireEvent.click(within(alert).getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(withdraw).toHaveBeenCalledTimes(2));
    expect(withdraw).toHaveBeenLastCalledWith("application-7");
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
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

  it("shows the label of the selected order instead of its value", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    expect(screen.getByRole("combobox", { name: "Ordenar postulaciones" })).toHaveTextContent("Fecha (más reciente)");
  });

  it("sorts affinity from lowest to highest using the dropdown", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    await userEvent.click(screen.getByRole("combobox", { name: "Ordenar postulaciones" }));
    await userEvent.click(screen.getByRole("option", { name: "Afinidad (menor a mayor)" }));

    expect(vacancyColumn()).toEqual(["Backend Java", "Analista de datos"]);
  });

  it("sorts affinity from highest to lowest using the dropdown", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    await userEvent.click(screen.getByRole("combobox", { name: "Ordenar postulaciones" }));
    await userEvent.click(screen.getByRole("option", { name: "Afinidad (mayor a menor)" }));

    expect(vacancyColumn()).toEqual(["Analista de datos", "Backend Java"]);
  });

  it("sorts companies alphabetically using the dropdown", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    await userEvent.click(screen.getByRole("combobox", { name: "Ordenar postulaciones" }));
    await userEvent.click(screen.getByRole("option", { name: "Empresa (A-Z)" }));

    expect(vacancyColumn()).toEqual(["Analista de datos", "Backend Java"]);
  });

  it("filters the applications with the status select", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    await selectStatus("Entrevista");
    expect(vacancyColumn()).toEqual(["Analista de datos"]);

    await selectStatus("Aceptada");
    expect(screen.getByText("No tienes postulaciones en este estado.")).toBeInTheDocument();

    await selectStatus("Todos");
    expect(vacancyColumn()).toHaveLength(2);
  });

  it("shows cards instead of the table on mobile", async () => {
    isMobile.mockReturnValue(true);
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);

    expect(await screen.findByText("Backend Java")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Mostrar:" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("hides the withdrawn applications until the person presses the withdrawn button", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    expect(vacancyColumn()).toEqual(["Analista de datos", "Backend Java"]);
    await userEvent.click(screen.getByRole("combobox", { name: "Mostrar:" }));
    expect(await screen.findByRole("option", { name: "En revisión" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Retirada" })).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("option")).not.toBeInTheDocument());

    const toggle = screen.getByRole("button", { name: "Postulaciones retiradas" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);

    await waitFor(() => expect(vacancyColumn()).toEqual(["Analista de datos", "Backend Java", "Frontend React"]));
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await selectStatus("Retirada");
    expect(vacancyColumn()).toEqual(["Frontend React"]);
  });

  it("goes back to all the applications when the withdrawn ones are hidden again", async () => {
    getMine.mockResolvedValue(APPLICATIONS);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("Backend Java");

    await userEvent.click(screen.getByRole("button", { name: "Postulaciones retiradas" }));
    await selectStatus("Retirada");
    expect(vacancyColumn()).toEqual(["Frontend React"]);
    await userEvent.click(screen.getByRole("button", { name: "Postulaciones retiradas" }));

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Mostrar:" })).toHaveTextContent("Todos"));
    expect(vacancyColumn()).toEqual(["Analista de datos", "Backend Java"]);
  });

  it("does not offer the withdrawn button when there are no withdrawn applications", async () => {
    getMine.mockResolvedValue([buildApplication()]);

    renderWithQuery(<ApplicationsView />);
    await screen.findByText("TechBolivia S.R.L.");

    expect(screen.queryByRole("button", { name: "Postulaciones retiradas" })).not.toBeInTheDocument();
  });

  it("explains that there are no active applications when all of them are withdrawn", async () => {
    getMine.mockResolvedValue([buildApplication({ status: "Retirada" })]);

    renderWithQuery(<ApplicationsView />);

    expect(await screen.findByText("No tienes postulaciones activas.")).toBeInTheDocument();
    expect(screen.queryByText("Todavía no te postulaste a ninguna vacante")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Postulaciones retiradas" }));

    expect(await screen.findByText("Desarrollador Backend Python / FastAPI")).toBeInTheDocument();
  });

  it("disables the withdraw button of the applications that already have a decision", async () => {
    getMine.mockResolvedValue([
      buildApplication({ id: "accepted", vacancyTitle: "Aceptada", status: "Aceptada" }),
      buildApplication({ id: "rejected", vacancyTitle: "Rechazada", status: "No seleccionado" }),
    ]);

    renderWithQuery(<ApplicationsView />);
    const buttons = await screen.findAllByRole("button", { name: "Retirar" });

    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => expect(button).toBeDisabled());
    fireEvent.click(buttons[0]);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(withdraw).not.toHaveBeenCalled();
  });

  it("goes to the chat with the application when the person contacts it", async () => {
    getMine.mockResolvedValue([buildApplication({ id: "application-7" })]);
    getContact.mockResolvedValue(CONTACT);

    renderWithQuery(<ApplicationsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Contactar" }));

    await waitFor(() => expect(getContact).toHaveBeenCalledWith("application-7"));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/chat?applicationId=application-7"));
  });

  it("goes to the chat from the cards on mobile", async () => {
    isMobile.mockReturnValue(true);
    getMine.mockResolvedValue([buildApplication({ id: "application-7" })]);
    getContact.mockResolvedValue(CONTACT);

    renderWithQuery(<ApplicationsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Contactar" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/chat?applicationId=application-7"));
  });

  it("tells the person when an application no longer allows contacting the recruiter", async () => {
    getMine.mockResolvedValue([buildApplication({ status: "No seleccionado" })]);

    renderWithQuery(<ApplicationsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Contactar" }));

    expect(toast.error).toHaveBeenCalledWith(
      "Esta postulación ya no permite la comunicación directa con el reclutador.",
    );
    expect(getContact).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("keeps the person on the page and reports the failure when the contact cannot be checked", async () => {
    getMine.mockResolvedValue([buildApplication()]);
    getContact.mockRejectedValue(new Error("Network Error"));

    renderWithQuery(<ApplicationsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Contactar" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "No pudimos abrir la conversación con el reclutador. Intenta nuevamente.",
        { action: { label: "Reintentar", onClick: expect.any(Function) } },
      ),
    );
    expect(router.push).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Contactar" })).toBeEnabled());
  });

  it("applies again to a withdrawn application only after the person confirms", async () => {
    getMine.mockResolvedValueOnce([buildApplication({ id: "application-7", status: "Retirada" })]);
    getMine.mockResolvedValueOnce([buildApplication({ id: "application-7" })]);
    reactivate.mockResolvedValue(undefined);

    renderWithQuery(<ApplicationsView />);
    await userEvent.click(await screen.findByRole("button", { name: "Postulaciones retiradas" }));
    fireEvent.click(await screen.findByRole("button", { name: "Volver a postular" }));

    expect(await screen.findByRole("alertdialog", { name: "¿Confirmar nueva postulación?" })).toBeInTheDocument();
    expect(reactivate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar postulación" }));

    await waitFor(() => expect(reactivate).toHaveBeenCalledWith("application-7"));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("does not show an old reactivation error when the dialog is opened again", async () => {
    getMine.mockResolvedValue([buildApplication({ id: "application-7", status: "Retirada" })]);
    reactivate.mockRejectedValueOnce(new Error("Conflict"));

    renderWithQuery(<ApplicationsView />);
    await userEvent.click(await screen.findByRole("button", { name: "Postulaciones retiradas" }));
    fireEvent.click(await screen.findByRole("button", { name: "Volver a postular" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar postulación" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo reactivar la postulación");

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Volver a postular" }));

    expect(await screen.findByRole("alertdialog", { name: "¿Confirmar nueva postulación?" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
