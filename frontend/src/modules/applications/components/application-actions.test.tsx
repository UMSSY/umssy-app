import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApplicationStatus } from "../types/application.types";
import { buildApplication } from "../testing/application-fixtures";
import { ApplicationActions } from "./application-actions";

afterEach(cleanup);

function renderActions(status: ApplicationStatus, withReactivation = true) {
  const handlers = { onWithdraw: vi.fn(), onContact: vi.fn(), onReactivate: vi.fn() };
  const application = buildApplication({ id: "application-7", status });
  render(
    <ApplicationActions
      application={application}
      withdrawingId={null}
      contactingId={null}
      reactivatingId={null}
      onWithdraw={handlers.onWithdraw}
      onContact={handlers.onContact}
      onReactivate={withReactivation ? handlers.onReactivate : undefined}
    />,
  );
  return { application, ...handlers };
}

describe("ApplicationActions", () => {
  it.each<ApplicationStatus>(["En revisión", "Entrevista", "Aceptada", "No seleccionado"])(
    "offers to contact and to withdraw when the status is %s",
    (status) => {
      renderActions(status);

      expect(screen.getByRole("button", { name: "Contactar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retirar" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Volver a postular" })).not.toBeInTheDocument();
    },
  );

  it("offers to contact and to apply again when the application was withdrawn", () => {
    renderActions("Retirada");

    expect(screen.getByRole("button", { name: "Contactar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver a postular" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retirar" })).not.toBeInTheDocument();
  });

  it("keeps the withdraw button of a withdrawn application when there is no way to reactivate it", () => {
    renderActions("Retirada", false);

    expect(screen.getByRole("button", { name: "Retirar" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Volver a postular" })).not.toBeInTheDocument();
  });

  it("sends every action to its own handler", () => {
    const open = renderActions("En revisión");
    fireEvent.click(screen.getByRole("button", { name: "Contactar" }));
    fireEvent.click(screen.getByRole("button", { name: "Retirar" }));

    expect(open.onContact).toHaveBeenCalledWith(open.application);
    expect(open.onWithdraw).toHaveBeenCalledWith("application-7");
    expect(open.onReactivate).not.toHaveBeenCalled();

    cleanup();
    const withdrawn = renderActions("Retirada");
    fireEvent.click(screen.getByRole("button", { name: "Volver a postular" }));

    expect(withdrawn.onReactivate).toHaveBeenCalledWith("application-7");
    expect(withdrawn.onWithdraw).not.toHaveBeenCalled();
  });
});
