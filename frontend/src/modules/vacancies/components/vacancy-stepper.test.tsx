import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VacancyStepper } from './vacancy-stepper';

describe('VacancyStepper', () => {
  it('renderiza el stepper en el paso inicial', () => {
    const { unmount } = render(<VacancyStepper currentStep={1} />);
    
    // Verificamos que los textos existan en el documento
    expect(screen.getByText('Informacion y condiciones')).toBeTruthy();
    expect(screen.getByText('Vista previa')).toBeTruthy();
    
    unmount(); // Limpiamos para la siguiente prueba
  });

  it('renderiza el stepper en el paso final cubriendo los estados completados', () => {
    render(<VacancyStepper currentStep={3} />);
    expect(screen.getByText('Descripcion y requisitos')).toBeTruthy();
  });
});
