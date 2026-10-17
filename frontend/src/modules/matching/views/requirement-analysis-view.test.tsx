import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_REQUIREMENT_TEXT_LENGTH,
  REQUIREMENT_EXAMPLE_TEXT,
} from "../constants/requirement-analysis.constants";
import { requirementTermsService } from "../services/requirement-terms.service";
import type { RequirementTermsResult } from "../types/requirement-terms.types";
import { RequirementAnalysisView } from "./requirement-analysis-view";

const RESULT: RequirementTermsResult = {
  tokens: ["egresado", "universidad", "mayor", "san", "simón", "python", "node.js", "scrum"],
  terms: [
    "egresado",
    "universidad",
    "mayor",
    "san",
    "simón",
    "python",
    "node.js",
    "scrum",
    "san_simón",
    "universidad_mayor_de_san_simon",
    "san_simon",
  ],
  skills: ["Python", "Node.js", "Scrum"],
  institutions: ["UMSS"],
};

const EMPTY_RESULT: RequirementTermsResult = { tokens: [], terms: [], skills: [], institutions: [] };

let analyze: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  analyze = vi.spyOn(requirementTermsService, "analyze");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderView() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RequirementAnalysisView />
    </QueryClientProvider>,
  );
}

const textField = () => screen.getByLabelText("Requisitos de la oferta");
const analyzeButton = () => screen.getByRole("button", { name: "Analizar" });

describe("RequirementAnalysisView", () => {
  it("muestra el formulario con el contador en cero y Analizar deshabilitado", () => {
    renderView();

    expect(screen.getByRole("heading", { name: "Analizar requisitos de una oferta" })).toBeInTheDocument();
    expect(screen.getByText(`0 / ${MAX_REQUIREMENT_TEXT_LENGTH}`)).toBeInTheDocument();
    expect(analyzeButton()).toBeDisabled();
  });

  it("rellena el área de texto con el texto de ejemplo", async () => {
    renderView();

    await userEvent.click(screen.getByRole("button", { name: "Usar texto de ejemplo" }));

    expect(textField()).toHaveValue(REQUIREMENT_EXAMPLE_TEXT);
    expect(screen.getByText(`${REQUIREMENT_EXAMPLE_TEXT.length} / ${MAX_REQUIREMENT_TEXT_LENGTH}`)).toBeInTheDocument();
    expect(analyzeButton()).toBeEnabled();
  });

  it("actualiza el contador al escribir y mantiene Analizar deshabilitado con solo espacios", () => {
    renderView();

    fireEvent.change(textField(), { target: { value: "   " } });

    expect(screen.getByText(`3 / ${MAX_REQUIREMENT_TEXT_LENGTH}`)).toBeInTheDocument();
    expect(analyzeButton()).toBeDisabled();
  });

  it("acepta exactamente 5000 caracteres", () => {
    renderView();

    fireEvent.change(textField(), { target: { value: "a".repeat(MAX_REQUIREMENT_TEXT_LENGTH) } });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(analyzeButton()).toBeEnabled();
  });

  it("muestra el error y bloquea el análisis con 5001 caracteres", () => {
    renderView();

    fireEvent.change(textField(), { target: { value: "a".repeat(MAX_REQUIREMENT_TEXT_LENGTH + 1) } });

    expect(screen.getByRole("alert")).toHaveTextContent(
      `El texto no puede superar los ${MAX_REQUIREMENT_TEXT_LENGTH} caracteres`,
    );
    expect(textField()).toHaveAttribute("aria-invalid", "true");
    expect(analyzeButton()).toBeDisabled();
    expect(analyze).not.toHaveBeenCalled();
  });

  it("analiza el texto, mide el tiempo en el cliente y muestra el resultado", async () => {
    let clock = 1000;
    const now = vi.spyOn(performance, "now").mockImplementation(() => clock);
    analyze.mockImplementation(async () => {
      clock += 30;
      return RESULT;
    });
    renderView();

    await userEvent.click(screen.getByRole("button", { name: "Usar texto de ejemplo" }));
    await userEvent.click(analyzeButton());

    expect(await screen.findByRole("heading", { name: "Resultado del análisis" })).toBeInTheDocument();
    expect(analyze).toHaveBeenCalledWith(REQUIREMENT_EXAMPLE_TEXT);
    expect(["Python", "Node.js", "Scrum"].map((skill) => screen.getAllByText(skill).length > 0)).toEqual([
      true,
      true,
      true,
    ]);
    expect(screen.getByText("UMSS")).toBeInTheDocument();
    expect(screen.getByText("universidad_mayor_de_san_simon")).toBeInTheDocument();
    expect(screen.getByText("san_simon")).toBeInTheDocument();
    expect(screen.getByText("Análisis completado en 0.03 s")).toBeInTheDocument();
    now.mockRestore();
  });

  it("muestra el estado de carga y deshabilita el botón mientras analiza", async () => {
    let resolve: (value: RequirementTermsResult) => void = () => undefined;
    analyze.mockReturnValue(new Promise<RequirementTermsResult>((done) => (resolve = done)));
    renderView();

    fireEvent.change(textField(), { target: { value: "Python" } });
    await userEvent.click(analyzeButton());

    expect(await screen.findByRole("button", { name: "Analizando..." })).toBeDisabled();
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();

    resolve(RESULT);
    expect(await screen.findByRole("heading", { name: "Resultado del análisis" })).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando el texto no tiene términos reconocibles", async () => {
    analyze.mockResolvedValue(EMPTY_RESULT);
    renderView();

    fireEvent.change(textField(), { target: { value: "..." } });
    await userEvent.click(analyzeButton());

    expect(await screen.findByRole("heading", { name: "No encontramos términos reconocibles" })).toBeInTheDocument();
  });

  it("muestra el error y permite reintentar con el mismo texto", async () => {
    analyze.mockRejectedValueOnce(new Error("fallo")).mockResolvedValueOnce(RESULT);
    renderView();

    fireEvent.change(textField(), { target: { value: "Python y Scrum" } });
    await userEvent.click(analyzeButton());

    expect(await screen.findByText("No pudimos analizar el texto. Intenta nuevamente.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Resultado del análisis" })).toBeInTheDocument());
    expect(analyze).toHaveBeenCalledTimes(2);
    expect(analyze).toHaveBeenLastCalledWith("Python y Scrum");
    expect(screen.queryByText("No pudimos analizar el texto. Intenta nuevamente.")).not.toBeInTheDocument();
  });

  it("envía el formulario con Enter en el botón y no analiza si el texto es inválido", () => {
    renderView();

    fireEvent.submit(textField().closest("form") as HTMLFormElement);

    expect(analyze).not.toHaveBeenCalled();
  });
});
