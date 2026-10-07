import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { PreviewStep } from './preview-step';
import type { VacancyConditions } from '../hooks/use-job-offer-form';

afterEach(cleanup);
describe('PreviewStep', () => {
  afterEach(() => {
    cleanup();
  });

  const mockConditions: VacancyConditions = {
    title: 'Ingeniero de Software',
    description: 'Buscamos un ingeniero de software con experiencia.',
    modality: 'Remoto',
    mapsLink: 'https://maps.test',
    contractType: 'Medio tiempo',
    category: 'IT',
    vacancyCount: '5',
    salary: 'Bs 10.000',
    languages: 'Inglés',
    requirementsDescription: '',
    skills: [],
  };

  it('renderiza correctamente con los datos ingresados', () => {
    render(<PreviewStep conditions={mockConditions} onPrevious={vi.fn()} />);
    expect(screen.getByText('Ingeniero de Software')).toBeInTheDocument();
    expect(screen.getByText('Remoto')).toBeInTheDocument();
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('5 vacantes')).toBeInTheDocument();
    expect(screen.getByText('Bs 10.000')).toBeInTheDocument();
    expect(screen.getByText('Inglés')).toBeInTheDocument();
  });

  it('renderiza valores por defecto si los datos están vacíos', () => {
    const emptyConditions: VacancyConditions = {
      title: '',
      description: '',
      modality: null,
      mapsLink: '',
      contractType: '',
      category: '',
      vacancyCount: '',
      salary: '',
      languages: '',
      requirementsDescription: '',
      skills: [],
    };

    render(<PreviewStep conditions={emptyConditions} onPrevious={vi.fn()} />);

    expect(screen.getByText('Desarrollador Backend')).toBeInTheDocument();
    expect(screen.getByText('Híbrido')).toBeInTheDocument();
    expect(screen.getByText('Tecnología')).toBeInTheDocument();
    expect(screen.getByText('Bs 6.500 - 8.000')).toBeInTheDocument();
  });

  it('expande y colapsa la descripción cuando supera 125 caracteres', () => {
    const description = 'a'.repeat(126);
    render(<PreviewStep conditions={{ ...mockConditions, description }} onPrevious={vi.fn()} />);

    const descriptionElement = screen.getByTestId('vacancy-description');
    expect(descriptionElement).toHaveTextContent(`${'a'.repeat(125)}…`);
    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }));
    expect(descriptionElement).toHaveTextContent(description);
    fireEvent.click(screen.getByRole('button', { name: 'Ver menos' }));
    expect(descriptionElement).toHaveTextContent(`${'a'.repeat(125)}…`);
  });

  it('no agrega el control de expansión a una descripción de 125 caracteres', () => {
    render(<PreviewStep conditions={{ ...mockConditions, description: 'a'.repeat(125) }} onPrevious={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Ver más' })).not.toBeInTheDocument();
  });

  it('muestra el enlace de Maps ingresado como hipervínculo seguro', () => {
    render(<PreviewStep conditions={mockConditions} onPrevious={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'https://maps.test' })).toHaveAttribute(
      'href',
      'https://maps.test',
    );
    expect(screen.getByRole('link', { name: 'https://maps.test' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'https://maps.test' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it('no crea un hipervínculo para URLs que no sean HTTP o HTTPS', () => {
    render(<PreviewStep conditions={{ ...mockConditions, mapsLink: 'javascript:alert(1)' }} onPrevious={vi.fn()} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
  });

  it('ejecuta la acción para volver al paso anterior', () => {
    const onPrevious = vi.fn();
    render(<PreviewStep conditions={mockConditions} onPrevious={onPrevious} />);

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));

    expect(onPrevious).toHaveBeenCalledOnce();
  });
});