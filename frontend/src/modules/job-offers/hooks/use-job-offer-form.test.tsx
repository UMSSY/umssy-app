import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DOCKER, VALID_CONDITIONS } from "../testing/vacancy-fixtures";
import { useJobOfferForm } from "./use-job-offer-form";

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

function fillInformation(result: { current: ReturnType<typeof useJobOfferForm> }) {
  act(() => {
    result.current.updateField("title", VALID_CONDITIONS.title);
    result.current.selectModality("Híbrido");
    result.current.updateField("mapsLink", VALID_CONDITIONS.mapsLink);
    result.current.updateField("contractType", VALID_CONDITIONS.contractType);
    result.current.updateField("category", VALID_CONDITIONS.category);
    result.current.updateField("vacancyCount", VALID_CONDITIONS.vacancyCount);
    result.current.updateField("salary", VALID_CONDITIONS.salary);
    result.current.updateField("languages", VALID_CONDITIONS.languages);
  });
}

describe("useJobOfferForm", () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("empieza en el paso 1 con el estado vacío", () => {
    const { result } = renderHook(() => useJobOfferForm(), { wrapper });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.conditions.skills).toEqual([]);
    expect(result.current.errors).toEqual({});
  });

  it("al continuar con campos vacíos marca todos los obligatorios y enfoca el primero", () => {
    document.body.innerHTML = '<input id="title" />';
    const { result } = renderHook(() => useJobOfferForm(), { wrapper });

    act(() => result.current.handleContinue());

    expect(result.current.currentStep).toBe(1);
    expect(Object.keys(result.current.errors)).toHaveLength(8);
    expect(document.activeElement).toBe(document.getElementById("title"));
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("quita el error de un campo en cuanto se corrige", () => {
    const { result } = renderHook(() => useJobOfferForm(), { wrapper });
    act(() => result.current.handleContinue());

    act(() => result.current.updateField("title", "DevOps"));

    expect(result.current.errors.title).toBeUndefined();
    expect(result.current.errors.category).toBe("Este campo es obligatorio");
  });

  it("avanza al paso 2 conservando los datos cuando el paso 1 es válido", () => {
    const { result } = renderHook(() => useJobOfferForm(), { wrapper });
    fillInformation(result);

    act(() => result.current.handleContinue());

    expect(result.current.currentStep).toBe(2);
    expect(result.current.errors).toEqual({});
    expect(result.current.conditions.title).toBe("DevOps Senior");
  });

  it("en el paso 2 exige descripción y habilidades antes de pasar a la vista previa", () => {
    document.body.innerHTML = '<textarea id="description"></textarea>';
    const { result } = renderHook(() => useJobOfferForm(), { wrapper });
    fillInformation(result);
    act(() => result.current.handleContinue());

    act(() => result.current.handleRequirementsContinue());
    expect(result.current.currentStep).toBe(2);
    expect(result.current.errors.description).toBe("Este campo es obligatorio");
    expect(result.current.errors.skills).toBe("Debes seleccionar al menos una habilidad requerida");

    act(() => {
      result.current.updateField("description", "Descripción");
      result.current.updateField("skills", [DOCKER]);
    });
    act(() => result.current.handleRequirementsContinue());

    expect(result.current.currentStep).toBe(3);
  });

  it("indica si hay cambios sin guardar, ignorando los espacios en blanco", () => {
    const { result } = renderHook(() => useJobOfferForm(), { wrapper });
    expect(result.current.hasUnsavedChanges).toBe(false);

    act(() => result.current.updateField("title", "   "));
    expect(result.current.hasUnsavedChanges).toBe(false);

    act(() => result.current.updateField("skills", [DOCKER]));
    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => result.current.reset());
    expect(result.current.hasUnsavedChanges).toBe(false);
  });
});