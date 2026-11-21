import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CancelRegistrationDialog } from './cancel-registration-dialog';

afterEach(() => {
  cleanup();
});

describe('CancelRegistrationDialog', () => {
  it('renders the warning message and action buttons when open', () => {
    render(
      <CancelRegistrationDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('dialog', {
        name: '¿Estás seguro de que deseas cancelar tu inscripción a este taller?',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Esta acción liberará tu cupo y ya no podrás acceder a los detalles de este taller.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Sí, cancelar' })).toBeEnabled();
  });

  it('calls onClose when clicking Volver or pressing Escape', () => {
    const onClose = vi.fn();
    render(
      <CancelRegistrationDialog
        open
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('calls onConfirm when clicking Sí, cancelar and disables actions when pending or disabled', () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <CancelRegistrationDialog
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    rerender(
      <CancelRegistrationDialog
        open
        disabled
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole('button', { name: 'Sí, cancelar' })).toBeDisabled();

    rerender(
      <CancelRegistrationDialog
        open
        pending
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole('button', { name: 'Volver' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Cancelando...' }),
    ).toBeDisabled();
  });
});