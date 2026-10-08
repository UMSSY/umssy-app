import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { RequirementsStep } from "./requirements-step";
import { VacancyConditions, UpdateVacancyField } from "../hooks/use-job-offer-form";

const mockConditions: VacancyConditions = {
  title: "",
  modality: null,
  mapsLink: "",
  contractType: "",
  category: "",
  vacancyCount: "",
  salary: "",
  languages: "",
  description: "",
  skills: [],
};

describe("RequirementsStep", () => {
  afterEach(() => {
    cleanup();
  });

  const renderStep = (
    conditions: VacancyConditions = mockConditions,
    updateField: UpdateVacancyField = vi.fn(),
    onPrevious: () => void = vi.fn(),
    onContinue: () => void = vi.fn(),
  ) => render(
    <RequirementsStep
      conditions={conditions}
      updateField={updateField}
      onPrevious={onPrevious}
      onContinue={onContinue}
    />
  );

  it("debe renderizar el textarea correctamente", () => {
    renderStep();

    expect(screen.getByPlaceholderText(/Buscamos un desarrollador backend/i)).toBeDefined();
  });

  it("debe llamar a updateField al escribir en la descripción respetando el límite", () => {
    const updateFieldMock = vi.fn();
    renderStep(mockConditions, updateFieldMock);

    const textarea = screen.getByPlaceholderText(/Buscamos un desarrollador backend/i);
    fireEvent.change(textarea, { target: { value: "Experiencia en React" } });

    expect(updateFieldMock).toHaveBeenCalledWith("description", "Experiencia en React");
  });

  it("debe agregar una habilidad a la lista al hacer clic en un chip no seleccionado", () => {
    const updateFieldMock = vi.fn();
    renderStep(mockConditions, updateFieldMock);

    const pythonChip = screen.getByText("Python");
    fireEvent.click(pythonChip);

    expect(updateFieldMock).toHaveBeenCalledWith("skills", ["Python"]);
  });

  it("debe remover una habilidad si se hace clic en un chip ya seleccionado", () => {
    const updateFieldMock = vi.fn();
    const conditionsWithSkill = { ...mockConditions, skills: ["Python"] };

    renderStep(conditionsWithSkill, updateFieldMock);

    const pythonChip = screen.getByText("Python");
    fireEvent.click(pythonChip);

    expect(updateFieldMock).toHaveBeenCalledWith("skills", []);
  });

  it("ejecuta la acción para volver al paso anterior", () => {
    const onPrevious = vi.fn();
    renderStep(mockConditions, vi.fn(), onPrevious);

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));

    expect(onPrevious).toHaveBeenCalledOnce();
  });

  it("ejecuta la acción para continuar al siguiente paso", () => {
    const onContinue = vi.fn();
    renderStep(mockConditions, vi.fn(), vi.fn(), onContinue);

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(onContinue).toHaveBeenCalledOnce();
  });
});