import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RegisterVacancyView } from './register-vacancy-view';
import * as useJobOfferFormHook from '../hooks/use-job-offer-form';
import type { VacancyConditions } from '../hooks/use-job-offer-form';

vi.mock('../hooks/use-job-offer-form', () => ({
  useJobOfferForm: vi.fn(),
}));

vi.mock('../components/vacancy-stepper', () => ({
  VacancyStepper: () => <div data-testid="vacancy-stepper">Stepper</div>
}));
vi.mock('../components/information-step', () => ({
  InformationStep: () => <div data-testid="information-step">Paso 1</div>
}));
vi.mock('../components/requirements-step', () => ({
  RequirementsStep: ({
    onPrevious,
    onContinue,
  }: {
    onPrevious: () => void;
    onContinue: () => void;
  }) => (
    <div data-testid="requirements-step">
      Paso 2
      <button onClick={onPrevious}>Anterior</button>
      <button onClick={onContinue}>Continuar</button>
    </div>
  )
}));
vi.mock('../components/preview-step', () => ({
  PreviewStep: ({ onPrevious }: { onPrevious: () => void }) => (
    <div data-testid="preview-step">
      Paso 3
      <button onClick={onPrevious}>Anterior</button>
    </div>
  )
}));

describe('RegisterVacancyView', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

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
  const validationMocks = {
    errors: {},
    validateMapsLink: vi.fn(),
    handleContinue: vi.fn(),
  };

  it('renderiza el paso 1 cuando currentStep es 1', () => {
    vi.spyOn(useJobOfferFormHook, 'useJobOfferForm').mockReturnValue({
      currentStep: 1,
      conditions: mockConditions,
      ...validationMocks,
      updateField: vi.fn(),
      selectModality: vi.fn(),
      goNext: vi.fn(),
      goBack: vi.fn(),
    });

    render(<RegisterVacancyView />);
    expect(screen.getByTestId('information-step')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-step')).not.toBeInTheDocument();
  });

  it('renderiza el paso 3 cuando currentStep es 3', () => {
    const goBack = vi.fn();
    vi.spyOn(useJobOfferFormHook, 'useJobOfferForm').mockReturnValue({
      currentStep: 3,
      conditions: mockConditions,
      ...validationMocks,
      updateField: vi.fn(),
      selectModality: vi.fn(),
      goNext: vi.fn(),
      goBack: goBack,
    });

    render(<RegisterVacancyView />);
    expect(screen.getByTestId('preview-step')).toBeInTheDocument();
    expect(screen.queryByTestId('information-step')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(goBack).toHaveBeenCalledOnce();
  });

  it('conecta los botones del paso 2 con las acciones de navegación', () => {
    const goBack = vi.fn();
    const goNext = vi.fn();
    vi.spyOn(useJobOfferFormHook, 'useJobOfferForm').mockReturnValue({
      currentStep: 2,
      conditions: mockConditions,
      ...validationMocks,
      updateField: vi.fn(),
      selectModality: vi.fn(),
      goNext,
      goBack,
    });

    render(<RegisterVacancyView />);

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(goBack).toHaveBeenCalledOnce();
    expect(goNext).toHaveBeenCalledOnce();
  });
});
