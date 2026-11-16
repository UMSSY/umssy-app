import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { useExpirationDate } from "../hooks/use-expiration-date";
import { ExpirationDateCard } from "./expiration-date-card";

function Harness() {
  const expiration = useExpirationDate();
  return <ExpirationDateCard expiration={expiration} />;
}

afterEach(() => {
  cleanup();
});

describe("ExpirationDateCard", () => {
  it("empieza sin fecha de cierre y sin calendario", () => {
    render(<Harness />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByText(/Sin fecha de cierre/i)).toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("al marcar el checkbox muestra el calendario", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText("Establecer fecha de expiración"));

    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.queryByText(/Sin fecha de cierre/i)).not.toBeInTheDocument();
  });

  it("al desmarcar el checkbox oculta el calendario", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText("Establecer fecha de expiración"));
    await userEvent.click(screen.getByText("Establecer fecha de expiración"));

    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(screen.getByText(/Sin fecha de cierre/i)).toBeInTheDocument();
  });
});