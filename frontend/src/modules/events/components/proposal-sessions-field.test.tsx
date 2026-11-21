import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProposalSessionsField } from './proposal-sessions-field';

afterEach(cleanup);

function renderField(overrides: Partial<Parameters<typeof ProposalSessionsField>[0]> = {}) {
  const props = {
    sessions: [{ eventDate: '2026-11-19', startTime: '09:00', endTime: '12:00' }], errors: [], minDate: '2026-11-03', maxDate: '2027-04-24',
    canAdd: true, disabled: false, onAdd: vi.fn(), onChange: vi.fn(), onRemove: vi.fn(), ...overrides,
  };
  render(<ProposalSessionsField {...props} />);
  return props;
}

describe('ProposalSessionsField', () => {
  it('adds and removes sessions numbered after the main session', () => {
    const props = renderField();
    expect(screen.getByText('Sesión 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar sesión 2' }));
    expect(props.onRemove).toHaveBeenCalledWith(0);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar sesión' }));
    expect(props.onAdd).toHaveBeenCalledOnce();
  });

  it('shows row errors and disables adding at the limit', () => {
    renderField({ errors: [{ startTime: 'Se superpone con otra sesión.' }], canAdd: false });
    expect(screen.getByText('Se superpone con otra sesión.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar sesión' })).toBeDisabled();
  });
});
