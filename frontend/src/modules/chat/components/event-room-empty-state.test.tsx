import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventRoomEmptyState } from './event-room-empty-state';

describe('EventRoomEmptyState', () => {
  it('muestra el mensaje de estado vacío', () => {
    const description = "Aún no hay mensajes. Envía el primero para comenzar la conversación.";
    render(<EventRoomEmptyState description={description} />);

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('muestra el icono junto al texto del estado vacío', () => {
    const description = "Aún no hay mensajes. Envía el primero para comenzar la conversación.";
    const { container } = render(<EventRoomEmptyState description={description} />);

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('svg')?.parentElement).toHaveClass(
      'bg-accent',
      'text-surface',
    );
  });
});
