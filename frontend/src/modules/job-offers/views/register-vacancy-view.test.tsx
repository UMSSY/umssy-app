import { Button as TestButton } from "@/components/ui/button";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_CONDITIONS, VALID_CONDITIONS } from "../testing/vacancy-fixtures";
import { RegisterVacancyView } from "./register-vacancy-view";

const { form, publication, leaveGuard } = vi.hoisted(() => ({
  form: {
    currentStep: 1,
    conditions: {},
    errors: {},
    hasUnsavedChanges: false,
    updateField: vi.fn(),
    selectModality: vi.fn(),
    validateField: vi.fn(),
    handleContinue: vi.fn(),
    handleRequirementsContinue: vi.fn(),
    goBack: vi.fn(),
    reset: vi.fn(),
  },
  publication: {
    status: "idle",
    error: null,
    isSubmitting: false,
    isSuccess: false,
    submit: vi.fn(),
    reset: vi.fn(),
  },
  leaveGuard: {
    isLeaveDialogOpen: false,
    confirmLeave: vi.fn(),
    cancelLeave: vi.fn(),
  },
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

const useLeaveGuard = vi.fn((isActive: boolean) => {
  void isActive;
  return leaveGuard;
});

vi.mock("../hooks/use-job-offer-form", () => ({ useJobOfferForm: () => form }));
vi.mock("../hooks/use-publish-job-offer", () => ({ usePublishJobOffer: () => publication }));
vi.mock("../hooks/use-leave-guard", () => ({ useLeaveGuard: (isActive: boolean) => useLeaveGuard(isActive) }));
vi.mock("../components/vacancy-stepper", () => ({
  VacancyStepper: ({ currentStep }: { currentStep: number }) => <div data-testid="stepper">Paso {currentStep}</div>,
}));
vi.mock("../components/information-step", () => ({
  InformationStep: ({ onCancel, onContinue }: { onCancel: () => void; onContinue: () => void }) => (
    <div data-testid="information-step">
      <TestButton onClick={onCancel}>Cancelar</TestButton>
      <TestButton onClick={onContinue}>Continuar</TestButton>
    </div>
  ),
}));
vi.mock("../components/requirements-step", () => ({
  RequirementsStep: ({ onPrevious, onContinue }: { onPrevious: () => void; onContinue: () => void }) => (
    <div data-testid="requirements-step">
      <TestButton onClick={onPrevious}>Anterior</TestButton>
      <TestButton onClick={onContinue}>Continuar</TestButton>
    </div>
  ),
}));
vi.mock("../components/preview-step", () => ({
  PreviewStep: (props: {
    onPrevious: () => void;
    onConfirm: () => void;
    onFinish: () => void;
    isSubmitting: boolean;
    isPublished: boolean;
    company: { name: string };
  }) => (
    <div data-testid="preview-step">
      <span>{props.isSubmitting ? "enviando" : "libre"}</span>
      <span>{props.isPublished ? "publicada" : "pendiente"}</span>
      <span>{props.company.name}</span>
      <TestButton onClick={props.onPrevious}>Anterior</TestButton>
      <TestButton onClick={props.onConfirm}>Confirmar publicación</TestButton>
      <TestButton onClick={props.onFinish}>Aceptar</TestButton>
    </div>
  ),
}));

function setStep(currentStep: number, conditions = EMPTY_CONDITIONS, hasUnsavedChanges = false) {
  form.currentStep = currentStep;
  form.conditions = conditions;
  form.hasUnsavedChanges = hasUnsavedChanges;
}

describe("RegisterVacancyView", () => {
  beforeEach(() => {
    publication.isSubmitting = false;
    publication.isSuccess = false;
    leaveGuard.isLeaveDialogOpen = false;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it("conecta Continuar de cada paso con su validación", () => {
    setStep(1);
    render(<RegisterVacancyView />);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(form.handleContinue).toHaveBeenCalledOnce();

    cleanup();
    setStep(2);
    render(<RegisterVacancyView />);
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(form.goBack).toHaveBeenCalledOnce();
    expect(form.handleRequirementsContinue).toHaveBeenCalledOnce();
  });

  it("Cancelar sin cambios no abre el diálogo y redirige", () => {
    setStep(1);
    render(<RegisterVacancyView />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByText("¿Descartar los cambios?")).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith("/recruiters");
  });

  it("Cancelar con cambios pide confirmación y descarta al confirmar", async () => {
    setStep(1, VALID_CONDITIONS, true);
    render(<RegisterVacancyView />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("¿Descartar los cambios?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));

    expect(form.reset).toHaveBeenCalledOnce();
    expect(publication.reset).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText("¿Descartar los cambios?")).not.toBeInTheDocument());
    expect(mockPush).toHaveBeenCalledWith("/recruiters");
  });

  it("activa el aviso de salida solo con cambios y sin publicar", () => {
    setStep(1, VALID_CONDITIONS, true);
    render(<RegisterVacancyView />);
    expect(useLeaveGuard).toHaveBeenLastCalledWith(true);

    cleanup();
    publication.isSuccess = true;
    render(<RegisterVacancyView />);
    expect(useLeaveGuard).toHaveBeenLastCalledWith(false);
  });

  it("publica con los datos acumulados y muestra el estado del envío", () => {
    setStep(3, VALID_CONDITIONS, true);
    publication.isSubmitting = true;
    render(<RegisterVacancyView />);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar publicación" }));

    expect(publication.submit).toHaveBeenCalledWith(VALID_CONDITIONS);
    expect(screen.getByText("enviando")).toBeInTheDocument();
  });
});