import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApplication } from "../testing/application-fixtures";
import { ApplicationsTable } from "./applications-table";

afterEach(cleanup);

describe("ApplicationsTable", () => {
  it("shows the vacancy, company and affinity without displaying application status", () => {
    render(
      <ApplicationsTable
        applications={[buildApplication()]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
        contactingId={null}
        onContact={vi.fn()}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Vacante y empresa" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Estado" })).not.toBeInTheDocument();
    expect(screen.getByText("Desarrollador Backend Python / FastAPI")).toBeInTheDocument();
    expect(screen.getByText("TechBolivia S.R.L.")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.queryByText("En revisión")).not.toBeInTheDocument();
  });

  it("links each application to the detail of its own vacancy", () => {
    render(
      <ApplicationsTable
        applications={[
          buildApplication({ id: "application-1", jobOfferId: "offer-1", vacancyTitle: "Analista de Datos" }),
          buildApplication({ id: "application-2", jobOfferId: "offer-2", vacancyTitle: "Diseñador UX" }),
        ]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
        contactingId={null}
        onContact={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: "Ver vacante: Analista de Datos" })).toHaveAttribute("href", "/vacancies/offer-1");
    expect(screen.getByRole("link", { name: "Ver vacante: Diseñador UX" })).toHaveAttribute("href", "/vacancies/offer-2");
  });

  it("lets the person withdraw an application that is still open", () => {
    const onWithdraw = vi.fn();
    render(
      <ApplicationsTable
        applications={[buildApplication({ id: "application-7" })]}
        withdrawingId={null}
        onWithdraw={onWithdraw}
        contactingId={null}
        onContact={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Retirar" }));

    expect(onWithdraw).toHaveBeenCalledWith("application-7");
  });

  it("shows the date on which the person applied", () => {
    render(
      <ApplicationsTable
        applications={[buildApplication({ appliedDate: "2026-11-10T12:00:00.000Z" })]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
        contactingId={null}
        onContact={vi.fn()}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Fecha" })).toBeInTheDocument();
    expect(screen.getByText("10/11/2026")).toBeInTheDocument();
  });

  it("lets the person contact the recruiter of an application", () => {
    const onContact = vi.fn();
    const application = buildApplication({ id: "application-7" });
    render(
      <ApplicationsTable
        applications={[application]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
        contactingId={null}
        onContact={onContact}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Contactar" }));

    expect(onContact).toHaveBeenCalledWith(application);
  });

  it("disables only the contact button of the application that is being opened in the chat", () => {
    render(
      <ApplicationsTable
        applications={[buildApplication({ id: "application-7" })]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
        contactingId="application-7"
        onContact={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Abriendo chat…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Retirar" })).toBeEnabled();
  });

  it("allows withdrawing an application regardless of previous decision", () => {
    render(
      <ApplicationsTable
        applications={[
          buildApplication({ id: "application-1", status: "Aceptada" }),
          buildApplication({ id: "application-2", status: "No seleccionado" }),
        ]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
        contactingId={null}
        onContact={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: "Retirar" });

    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => expect(button).toBeEnabled());
    expect(screen.queryByText("No disponible")).not.toBeInTheDocument();
  });

  it("disables the button of the application that is being withdrawn", () => {
    render(
      <ApplicationsTable
        applications={[buildApplication({ id: "application-7" })]}
        withdrawingId="application-7"
        onWithdraw={vi.fn()}
        contactingId={null}
        onContact={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Retirando…" })).toBeDisabled();
  });

  it("shows the reactivation button only for withdrawn applications", () => {
    const onReactivate = vi.fn();

    render(
      <ApplicationsTable
        applications={[
          buildApplication({ id: "application-1", status: "Retirada" }),
          buildApplication({ id: "application-2", status: "En revisión" }),
        ]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
        contactingId={null}
        onContact={vi.fn()}
        onReactivate={onReactivate}
      />,
    );

    const button = screen.getByRole("button", { name: "Volver a postular" });
    expect(button).toBeEnabled();
    expect(screen.getAllByRole("button", { name: "Retirar" })).toHaveLength(1);

    fireEvent.click(button);
    expect(onReactivate).toHaveBeenCalledWith("application-1");
  });

});
