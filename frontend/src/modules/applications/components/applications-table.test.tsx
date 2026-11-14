
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApplication } from "../testing/application-fixtures";
import { ApplicationsTable } from "./applications-table";

afterEach(cleanup);

describe("ApplicationsTable", () => {
  it("shows the vacancy, the company, the affinity and the status of every application", () => {
    render(
      <ApplicationsTable
        applications={[buildApplication()]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("columnheader", { name: "Vacante" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Empresa" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Desarrollador Backend Python / FastAPI"),
    ).toBeInTheDocument();
    expect(screen.getByText("TechBolivia S.R.L.")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("En revisión")).toBeInTheDocument();
  });

  it("lets the person withdraw an application that is still open", () => {
    const onWithdraw = vi.fn();

    render(
      <ApplicationsTable
        applications={[buildApplication({ id: "application-7" })]}
        withdrawingId={null}
        onWithdraw={onWithdraw}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Retirar" }));

    expect(onWithdraw).toHaveBeenCalledWith("application-7");
  });

  it("disables the withdraw button of an application that already has a decision", () => {
    render(
      <ApplicationsTable
        applications={[
          buildApplication({ id: "application-1", status: "Aceptada" }),
          buildApplication({
            id: "application-2",
            status: "No seleccionado",
          }),
        ]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: "Retirar" });

    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => expect(button).toBeDisabled());
    expect(screen.queryByText("No disponible")).not.toBeInTheDocument();
  });

  it("disables the button of the application that is being withdrawn", () => {
    render(
      <ApplicationsTable
        applications={[buildApplication({ id: "application-7" })]}
        withdrawingId="application-7"
        onWithdraw={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Retirando…" }),
    ).toBeDisabled();
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
        onReactivate={onReactivate}
      />,
    );

    const button = screen.getByRole("button", {
      name: "Volver a postular",
    });

    expect(button).toBeEnabled();
    expect(
      screen.getAllByRole("button", { name: "Retirar" }),
    ).toHaveLength(1);

    fireEvent.click(button);

    expect(onReactivate).toHaveBeenCalledWith("application-1");
  });
});
