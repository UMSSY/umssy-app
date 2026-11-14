import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReactivateApplicationButton } from "./reactivate-application-button";

afterEach(cleanup);

describe("ReactivateApplicationButton", () => {
  it("asks to apply again with the identifier of its application", () => {
    const onReactivate = vi.fn();
    render(<ReactivateApplicationButton applicationId="application-7" onReactivate={onReactivate} />);

    fireEvent.click(screen.getByRole("button", { name: "Volver a postular" }));

    expect(onReactivate).toHaveBeenCalledWith("application-7");
  });

  it("uses the success green of the theme", () => {
    render(<ReactivateApplicationButton applicationId="application-7" onReactivate={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Volver a postular" })).toHaveClass("bg-success");
  });

  it("shows that the application is being sent and blocks a second click", () => {
    const onReactivate = vi.fn();
    render(
      <ReactivateApplicationButton
        applicationId="application-7"
        reactivatingId="application-7"
        onReactivate={onReactivate}
      />,
    );

    const button = screen.getByRole("button", { name: "Reactivando…" });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(onReactivate).not.toHaveBeenCalled();
  });
});
