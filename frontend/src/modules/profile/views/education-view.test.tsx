import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EducationView } from "./education-view";

describe("EducationView", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the title Trayectoria and the registered education records", () => {
    render(<EducationView />);

    expect(screen.getByRole("heading", { level: 1, name: "Trayectoria" })).toBeInTheDocument();
    expect(screen.getByText("Ingeniería Informática")).toBeInTheDocument();
    expect(screen.getByText("Bachiller en Humanidades")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar Ingeniería Informática" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar Ingeniería Informática" })).toBeInTheDocument();
  });

  it("renders the four numbered trajectory sub-tabs with education as active", () => {
    render(<EducationView />);

    const list = screen.getByRole("list", { name: "Sub-secciones de trayectoria" });

    expect(list).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Formación académica")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("Experiencia laboral")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText("Habilidades")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
    expect(screen.getByText("Certificaciones")).toBeInTheDocument();
  });

  it("marks Trayectoria as the active tab", () => {
    render(<EducationView />);

    expect(screen.getByRole("link", { name: "Trayectoria" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Datos personales" })).not.toHaveAttribute("aria-current");
  });

  it("shows the form fields and the save button", () => {
    render(<EducationView />);

    expect(screen.getByLabelText(/Institución/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Título o carrera/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Desde/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hasta/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción \(opcional\)/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar formación" })).toBeInTheDocument();
  });

  it("prevents the page reload when the form is submitted", () => {
    render(<EducationView />);

    const form = screen.getByRole("form", { name: "Agregar formación" });
    const wasNotPrevented = fireEvent.submit(form);

    expect(wasNotPrevented).toBe(false);
  });
});
