import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { surveysService } from "../services/surveys.service";
import { SurveysView } from "./surveys-view";

function getBodyRows() {
  return screen.getAllByRole("row").slice(1);
}

describe("SurveysView", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("muestra el título y la primera página de encuestas", async () => {
    renderWithQuery(<SurveysView />);

    expect(screen.getByRole("heading", { name: "Encuestas" })).toBeDefined();
    await waitFor(() => expect(screen.getByText("Mostrando 1-10 de 24 encuestas")).toBeDefined());
    expect(getBodyRows()).toHaveLength(10);
  });

  it("cambia de página", async () => {
    const spy = vi.spyOn(surveysService, "getSurveys");
    renderWithQuery(<SurveysView />);
    await waitFor(() => expect(screen.getByText("Mostrando 1-10 de 24 encuestas")).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));

    await waitFor(() => expect(screen.getByText("Mostrando 11-20 de 24 encuestas")).toBeDefined());
    expect(spy).toHaveBeenLastCalledWith({ page: 2, limit: 10, period: undefined, search: "" });
  });

  it("filtra por gestión y vuelve a la primera página", async () => {
    const spy = vi.spyOn(surveysService, "getSurveys");
    const user = userEvent.setup();
    renderWithQuery(<SurveysView />);
    await waitFor(() => expect(screen.getByText("Mostrando 1-10 de 24 encuestas")).toBeDefined());
    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
    await waitFor(() => expect(screen.getByText("Mostrando 11-20 de 24 encuestas")).toBeDefined());

    await user.click(screen.getByRole("combobox", { name: "Gestión académica" }));
    await user.click(await screen.findByRole("option", { name: "I-2025" }));

    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith({ page: 1, limit: 10, period: "I-2025", search: "" }),
    );
    await waitFor(() => expect(getBodyRows().every((row) => row.textContent?.includes("I-2025"))).toBe(true));
  });

  it("busca por correo del administrador", async () => {
    const spy = vi.spyOn(surveysService, "getSurveys");
    renderWithQuery(<SurveysView />);
    await waitFor(() => expect(screen.getByText("Mostrando 1-10 de 24 encuestas")).toBeDefined());

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar por correo electrónico" }), {
      target: { value: "carla" },
    });

    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith({ page: 1, limit: 10, period: undefined, search: "carla" }),
    );
    await waitFor(() =>
      expect(getBodyRows().every((row) => row.textContent?.includes("carla.arce@umssy.edu"))).toBe(true),
    );
  });

  it("muestra un mensaje de error si falla la carga", async () => {
    vi.spyOn(surveysService, "getSurveys").mockRejectedValue(new Error("Network error"));

    renderWithQuery(<SurveysView />);

    await waitFor(() => expect(screen.getByText("No se pudieron cargar las encuestas.")).toBeDefined());
  });
});
