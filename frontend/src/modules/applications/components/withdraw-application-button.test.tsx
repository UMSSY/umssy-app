import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApplicationStatus } from "../types/application.types";
import { buildApplication } from "../testing/application-fixtures";
import { WithdrawApplicationButton } from "./withdraw-application-button";

afterEach(cleanup);

describe("WithdrawApplicationButton", () => {
  it.each<ApplicationStatus>(["En revisión", "Entrevista"])("is enabled when the status is %s", (status) => {
    const onWithdraw = vi.fn();
    render(
      <WithdrawApplicationButton
        application={buildApplication({ id: "application-7", status })}
        withdrawingId={null}
        onWithdraw={onWithdraw}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Retirar" }));

    expect(onWithdraw).toHaveBeenCalledWith("application-7");
  });

  it.each<ApplicationStatus>(["Aceptada", "No seleccionado", "Retirada"])(
    "is disabled when the status is %s",
    (status) => {
      const onWithdraw = vi.fn();
      render(
        <WithdrawApplicationButton
          application={buildApplication({ status })}
          withdrawingId={null}
          onWithdraw={onWithdraw}
        />,
      );

      const button = screen.getByRole("button", { name: "Retirar" });
      fireEvent.click(button);

      expect(button).toBeDisabled();
      expect(onWithdraw).not.toHaveBeenCalled();
    },
  );

  it("shows that the application is being withdrawn and blocks a second click", () => {
    render(
      <WithdrawApplicationButton
        application={buildApplication({ id: "application-7" })}
        withdrawingId="application-7"
        onWithdraw={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Retirando…" })).toBeDisabled();
  });

  it("stays enabled while another application is being withdrawn", () => {
    render(
      <WithdrawApplicationButton
        application={buildApplication({ id: "application-7" })}
        withdrawingId="application-8"
        onWithdraw={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Retirar" })).toBeEnabled();
  });
});
