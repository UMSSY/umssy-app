import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { PersonalInfoView } from "./personal-info-view";
import { PresentationView } from "./presentation-view";

describe("PersonalInfoView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the personal information section", () => {
    render(<PersonalInfoView />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Datos personales y contacto" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Datos personales" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByText("Al guardar, verás una confirmación de que tus datos quedaron registrados."),
    ).toBeInTheDocument();
  });

  it("keeps the saved values when cancelling after saving", async () => {
    const user = userEvent.setup();
    render(<PersonalInfoView />);

    await user.type(screen.getByLabelText(/Nombres/), "Valeria");
    await user.type(screen.getByLabelText(/Apellidos/), "Quispe");
    await user.selectOptions(screen.getByLabelText(/Ciudad de residencia/), "Cochabamba");
    await user.type(screen.getByLabelText(/Teléfono/), "+591 70000000");
    await user.type(screen.getByLabelText(/Correo personal/), "valeria@correo.com");
    await user.click(screen.getByRole("button", { name: "Guardar perfil" }));
    await user.type(screen.getByLabelText(/Nombres/), " changed");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByLabelText(/Nombres/)).toHaveValue("Valeria");
  });
});

describe("PresentationView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the professional presentation section", () => {
    render(<PresentationView />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Presentación profesional" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Presentación" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps the saved values when cancelling after saving", async () => {
    const user = userEvent.setup();
    render(<PresentationView />);

    await user.type(screen.getByLabelText(/Titular profesional/), "Desarrolladora");
    await user.type(screen.getByLabelText(/Acerca de/), "Graduate from UMSS.");
    await user.click(screen.getByRole("button", { name: "Guardar presentación" }));
    await user.type(screen.getByLabelText(/Titular profesional/), " web");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByLabelText(/Titular profesional/)).toHaveValue("Desarrolladora");
  });
});
