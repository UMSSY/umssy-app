import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { useExpirationDate } from "../hooks/use-expiration-date";
import { ExpirationDateCard } from "./expiration-date-card";

const TODAY = new Date(2026, 10, 15); // 15 de noviembre de 2026

function Harness() {
  const expiration = useExpirationDate();
  return <ExpirationDateCard expiration={expiration} today={TODAY} />;
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

  
  it("al elegir un día pide confirmación con la fecha completa", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText("Establecer fecha de expiración"));
    await pickFirstAvailableDay();

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("¿Confirmar fecha de cierre?")).toBeInTheDocument();
    expect(within(dialog).getByText(/a las 23:59/)).toBeInTheDocument();
  });

  it("'Sí, confirmar' cierra el modal y oculta el calendario", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText("Establecer fecha de expiración"));
    await pickFirstAvailableDay();
    await userEvent.click(await screen.findByRole("button", { name: "Sí, confirmar" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("'No' cierra el modal y vuelve al calendario sin fecha marcada", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText("Establecer fecha de expiración"));
    await pickFirstAvailableDay();
    await userEvent.click(await screen.findByRole("button", { name: "No" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.queryByRole("gridcell", { selected: true })).not.toBeInTheDocument();
  });

    it("con la fecha confirmada muestra el resumen con los días que faltan", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText("Establecer fecha de expiración"));
    await userEvent.click(screen.getByRole("button", { name: /20 de noviembre/i }));
    await userEvent.click(await screen.findByRole("button", { name: "Sí, confirmar" }));

    expect(screen.getByText(/se cerrará automáticamente el/i)).toBeInTheDocument();
    expect(screen.getByText("viernes 20 de noviembre de 2026")).toBeInTheDocument();
    expect(screen.getByText(/Faltan 5 días/)).toBeInTheDocument();
  });

  it("'Cambiar fecha' vuelve a mostrar el calendario con la fecha marcada", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText("Establecer fecha de expiración"));
    await userEvent.click(screen.getByRole("button", { name: /20 de noviembre/i }));
    await userEvent.click(await screen.findByRole("button", { name: "Sí, confirmar" }));
    await userEvent.click(screen.getByRole("button", { name: "Cambiar fecha" }));

    expect(screen.queryByText(/se cerrará automáticamente el/i)).not.toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { selected: true })).toHaveTextContent("20");
  });
});

async function pickFirstAvailableDay() {
  const days = screen.getAllByRole("button").filter((button) => button.hasAttribute("data-day"));
  const firstEnabled = days.find((day) => !day.hasAttribute("disabled"));
  if (!firstEnabled) throw new Error("No hay días disponibles en el calendario");
  await userEvent.click(firstEnabled);
}