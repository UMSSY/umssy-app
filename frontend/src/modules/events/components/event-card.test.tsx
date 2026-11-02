import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  calculateEventCapacityStatus,
  formatEventDate,
  formatTimeRange,
} from '../utils/event-card';
import { EventCard } from './event-card';
import type { EventItem } from '../types/event.types';

const MOCK_EVENT: EventItem = {
  id: 'e1a2b3c4-0001-4000-8000-000000000001',
  title: 'Desarrollo Web con React',
  description: 'Taller practico de React.',
  category: { id: 'a1a1a1a1-0001-4000-8000-000000000001', name: 'Tecnologia' },
  instructorName: 'Ing. Carlos Mendoza',
  eventDate: '2026-10-15',
  startTime: '09:00:00',
  endTime: '13:00:00',
  location: 'Auditorio FCyT',
  capacity: 30,
  availableSpots: 6,
  registrationCount: 24,
  statusId: 'b1b1b1b1-0001-4000-8000-000000000001',
  modalityId: 'c1c1c1c1-0001-4000-8000-000000000001',
};

afterEach(() => {
  cleanup();
});

describe('EventCard y utilidades de formato', () => {
  it('calcula ocupacion desde el DTO GET /events', () => {
    expect(calculateEventCapacityStatus(MOCK_EVENT)).toEqual({
      enrolledCount: 24,
      capacity: 30,
      progressPercentage: 80,
      isFull: false,
    });
  });

  it('marca como lleno al llegar a la capacidad y limita el porcentaje a 100', () => {
    const fullEvent: EventItem = {
      ...MOCK_EVENT,
      availableSpots: 0,
      registrationCount: 32,
    };

    expect(calculateEventCapacityStatus(fullEvent)).toEqual({
      enrolledCount: 32,
      capacity: 30,
      progressPercentage: 100,
      isFull: true,
    });
  });

  it('trata capacidad null como cupos sin limite', () => {
    const unlimitedEvent: EventItem = {
      ...MOCK_EVENT,
      capacity: null,
      availableSpots: null,
    };

    expect(calculateEventCapacityStatus(unlimitedEvent)).toEqual({
      enrolledCount: 24,
      capacity: null,
      progressPercentage: null,
      isFull: false,
    });
  });

  it('formatea correctamente fechas validas y retorna el valor original si es invalido', () => {
    expect(formatEventDate('2026-10-15')).toContain('15');
    expect(formatEventDate('fecha-invalida')).toBe('fecha-invalida');
  });

  it('formatea correctamente rangos de hora con o sin segundos', () => {
    expect(formatTimeRange('09:00:00', '13:00:00')).toBe('09:00 - 13:00 hrs');
    expect(formatTimeRange('inicio', 'fin')).toBe('Horario no disponible');
  });

  it.each([
    ['00:00', '12:00', '00:00 - 12:00 hrs'],
    ['13:00:00', '23:59:00', '13:00 - 23:59 hrs'],
    ['1970-01-01T09:00:00.000Z', '1970-01-01T12:00:00.000Z', '09:00 - 12:00 hrs'],
    ['24:00', '12:00', 'Horario no disponible'],
  ])('shows an unambiguous time range for %s to %s', (start, end, expected) => {
    expect(formatTimeRange(start, end)).toBe(expected);
  });

  it('renderiza el titulo, categoria, fecha, horario y relacion de cupos', () => {
    render(<EventCard event={MOCK_EVENT} />);

    expect(
      screen.getByRole('heading', { name: 'Desarrollo Web con React' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tecnologia')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 13:00 hrs')).toBeInTheDocument();
    expect(screen.getByText('24/30')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '80',
    );
  });

  it('aplica estilo por defecto para categorias no mapeadas y estado seleccionado', () => {
    const customCategoryEvent: EventItem = {
      ...MOCK_EVENT,
      category: {
        id: 'a1a1a1a1-0099-4000-8000-000000000099',
        name: 'Robotica',
      },
    };

    render(<EventCard event={customCategoryEvent} isSelected />);

    const cardButton = screen.getByRole('button', {
      name: /desarrollo web con react/i,
    });
    expect(cardButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Robotica')).toBeInTheDocument();
  });

  it('ejecuta el callback onSelect al hacer clic y al presionar Enter o Espacio', () => {
    const handleSelect = vi.fn();
    render(<EventCard event={MOCK_EVENT} onSelect={handleSelect} />);

    const cardButton = screen.getByRole('button', {
      name: /desarrollo web con react/i,
    });

    fireEvent.click(cardButton);
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(MOCK_EVENT);

    fireEvent.keyDown(cardButton, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(cardButton, { key: ' ' });
    expect(handleSelect).toHaveBeenCalledTimes(3);
    fireEvent.keyDown(cardButton, { key: 'Escape' });
    expect(handleSelect).toHaveBeenCalledTimes(3);
  });

  it('muestra cupos ilimitados sin dividir por capacidad nula', () => {
    const unlimitedEvent: EventItem = {
      ...MOCK_EVENT,
      capacity: null,
      availableSpots: null,
    };

    render(<EventCard event={unlimitedEvent} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Sin limite de cupos')).toBeInTheDocument();
    expect(screen.getByText('24 inscritos')).toBeInTheDocument();
  });

  it('muestra el estado lleno y una barra completa para un evento sin cupos disponibles', () => {
    const fullEvent: EventItem = {
      ...MOCK_EVENT,
      availableSpots: 0,
      registrationCount: 30,
    };

    render(<EventCard event={fullEvent} />);

    expect(screen.getByTestId('event-full-badge')).toHaveTextContent('Lleno');
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.getByTestId('event-capacity-bar')).toHaveStyle({
      width: '100%',
    });
  });

  it('muestra apoyos y plazo en una propuesta en votación sin confundirlos con cupos', () => {
    render(<EventCard event={{
      ...MOCK_EVENT,
      status: 'voting',
      capacity: 40,
      registrationCount: 14,
      availableSpots: 26,
      supportCount: 14,
      supportThreshold: 20,
      supportsRemaining: 6,
      progressPercent: 70,
      votingDeadline: '2026-10-15T02:00:00.000Z',
      hasSupported: true,
    }} />);

    expect(screen.getByText('En votación')).toBeInTheDocument();
    expect(screen.getByText('14 de 20 apoyos')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('Faltan 6 apoyos para publicar el taller.')).toBeInTheDocument();
    expect(screen.getByText(/Fecha límite: 14.*oct.*2026/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /apoyos para/i })).toHaveAttribute('aria-valuenow', '70');
    expect(screen.queryByRole('progressbar', { name: /cupos ocupados/i })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Tu apoyo ya fue registrado');
  });

  it('muestra el plazo vencido sin invitar a seguir apoyando', () => {
    render(<EventCard event={{
      ...MOCK_EVENT,
      status: 'Vencido',
      supportCount: 5,
      supportThreshold: 20,
      supportsRemaining: 15,
      progressPercent: 25,
      votingDeadline: '2026-10-15T02:00:00.000Z',
      hasSupported: true,
    }} />);

    expect(screen.getByText('Vencido')).toBeInTheDocument();
    expect(screen.getByText('5 de 20 apoyos')).toBeInTheDocument();
    expect(screen.getByText('Fecha límite superada · vencida automáticamente')).toBeInTheDocument();
    expect(screen.queryByText(/Faltan .* apoyos/)).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: /cupos ocupados/i })).not.toBeInTheDocument();
  });

  it('conserva la barra de cupos para un taller publicado', () => {
    render(<EventCard event={{ ...MOCK_EVENT, status: 'Publicado', supportCount: 24, supportThreshold: 20 }} />);

    expect(screen.getByText('Publicada')).toBeInTheDocument();
    expect(screen.getByText('24/30')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /cupos ocupados/i })).toHaveAttribute('aria-valuenow', '80');
    expect(screen.queryByRole('progressbar', { name: /apoyos para/i })).not.toBeInTheDocument();
  });

  it('no inventa un progreso si faltan datos de apoyos', () => {
    render(<EventCard event={{ ...MOCK_EVENT, status: 'voting' }} />);

    expect(screen.getByText('Información de apoyos no disponible.')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
