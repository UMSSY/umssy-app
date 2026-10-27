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

    expect(screen.getByRole("columnheader", { name: "Vacante" })).toBeInTheDocument();
    expect(screen.getByText("Desarrollador Backend Python / FastAPI")).toBeInTheDocument();
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

  it("does not offer to withdraw an application that already has a decision", () => {
    render(
      <ApplicationsTable
        applications={[buildApplication({ status: "Aceptada" })]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Retirar" })).not.toBeInTheDocument();
    expect(screen.getByText("No disponible")).toBeInTheDocument();
  });

  it("disables the button of the application that is being withdrawn", () => {
    render(
      <ApplicationsTable
        applications={[buildApplication({ id: "application-7" })]}
        withdrawingId="application-7"
        onWithdraw={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Retirando…" })).toBeDisabled();
  });
});
