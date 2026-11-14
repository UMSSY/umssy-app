import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApplication } from "../testing/application-fixtures";
import { ApplicationsMobileList } from "./applications-mobile-list";

afterEach(cleanup);

describe("ApplicationsMobileList", () => {
  it("shows the vacancy, the company, the affinity and the status of every application", () => {
    render(<ApplicationsMobileList applications={[buildApplication()]} withdrawingId={null} onWithdraw={vi.fn()} />);

    expect(screen.getByText("Desarrollador Backend Python / FastAPI")).toBeInTheDocument();
    expect(screen.getByText("TechBolivia S.R.L.")).toBeInTheDocument();
    expect(screen.getByText("Afinidad: 92%")).toBeInTheDocument();
    expect(screen.getByText("En revisión")).toBeInTheDocument();
  });

  it("lets the person withdraw an application that is still open", () => {
    const onWithdraw = vi.fn();
    render(
      <ApplicationsMobileList
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
      <ApplicationsMobileList
        applications={[buildApplication({ status: "No seleccionado" })]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Retirar" })).toBeDisabled();
    expect(screen.queryByText("No disponible")).not.toBeInTheDocument();
  });

  it("shows the reactivation button only for withdrawn applications", () => {
    const onReactivate = vi.fn();

    render(
      <ApplicationsMobileList
        applications={[
          buildApplication({ id: "application-1", status: "Retirada" }),
          buildApplication({ id: "application-2", status: "En revisión" }),
        ]}
        withdrawingId={null}
        onWithdraw={vi.fn()}
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
