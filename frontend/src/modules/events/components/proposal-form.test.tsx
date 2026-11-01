import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_PROPOSAL } from '../constants/proposal.constants';
import { ProposalForm } from './proposal-form';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../hooks/use-proposal-form', () => ({ useProposalForm: () => state }));
const state = {
  values: { ...EMPTY_PROPOSAL, eventDate: '2026-11-12' }, errors: {}, touch: vi.fn(), change: vi.fn(),
  categories: { categories: [], isLoading: false, error: null, retry: vi.fn() },
  tutor: 'Ana López', profile: { isPending: false, isError: false, refetch: vi.fn() },
  pending: false, restoring: false, created: null, draftWarning: null, cover: null,
  changeCover: vi.fn(), setCoverBusy: vi.fn(), coverBusy: false, message: null,
  reviewing: false, closeReview: vi.fn(), confirm: vi.fn(), review: vi.fn(), unavailable: false,
};
beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ now: new Date('2026-10-24T12:00:00Z'), toFake: ['Date'] }); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('proposal shared date field', () => {
  it('keeps proposal limits while using the shared date entry contract', () => {
    render(<ProposalForm />);
    const date = screen.getByRole('textbox', { name: /Fecha del taller/ });
    expect(date).toHaveValue('12/11/2026');
    expect(date).toHaveAttribute('min', '2026-11-03');
    expect(date).toHaveAttribute('max', '2027-04-24');
    fireEvent.change(date, { target: { value: '13/11/2026' } });
    expect(state.change).toHaveBeenCalledWith('eventDate', '2026-11-13');
  });
});

 it('shows the physical location limit and reveals the counter near the limit', () => {
    const { rerender } = render(<ProposalForm />);
    expect(screen.getByRole('textbox', { name: /Ubicación/ })).toHaveAttribute('maxlength', '150');
    expect(screen.queryByText('130/150')).not.toBeInTheDocument();
    state.values.location = 'a'.repeat(130);
    rerender(<ProposalForm />);
    expect(screen.getByText('130/150')).toBeInTheDocument();
    state.values.location = '';
  });

it('marks a field for validation when leaving it', () => {
  render(<ProposalForm />);
  fireEvent.blur(screen.getByRole('textbox', { name: /Título del taller/ }));
  expect(state.touch).toHaveBeenCalledWith('title');
});
