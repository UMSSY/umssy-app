import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RequestStepsSidebar } from './request-steps-sidebar';

afterEach(() => {
  cleanup();
});

describe('RequestStepsSidebar', () => {
  it('resalta únicamente el paso actual', () => {
    const { container } = render(<RequestStepsSidebar currentStep={3} />);
    const activeSteps = container.querySelectorAll('[aria-current="step"]');

    expect(activeSteps).toHaveLength(1);
    expect(activeSteps[0].textContent).toContain('Revisión de la carrera');
  });

  it('muestra los cuatro pasos y el subtítulo del documento', () => {
    render(<RequestStepsSidebar currentStep={3} />);

    expect(screen.getByText('Tus datos')).toBeTruthy();
    expect(screen.getByText('Documento de respaldo')).toBeTruthy();
    expect(screen.getByText('Diploma o título')).toBeTruthy();
    expect(screen.getByText('Activación de cuenta')).toBeTruthy();
  });

  it('muestra el indicador compacto para celular', () => {
    render(<RequestStepsSidebar currentStep={3} />);

    expect(screen.getByText('Paso 3 de 4: Revisión de la carrera')).toBeTruthy();
  });

  it('no falla cuando el paso está fuera de rango', () => {
    const { container } = render(<RequestStepsSidebar currentStep={9} />);

    expect(screen.getByText(/Paso 9 de 4/)).toBeTruthy();
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(0);
  });
});
