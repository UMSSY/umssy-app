import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_PROPOSAL } from '../constants/proposal.constants';
import { ProposalReviewDialog } from './proposal-review-dialog';

afterEach(cleanup);

describe('QA HU04 review confirmation', () => {
  it('uses the required action labels and keeps the voting explanation static', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const props = { open: true, values: { ...EMPTY_PROPOSAL, capacity: '40' }, cover: null,
      tutor: 'Ana', category: 'Tecnología', pending: false, unavailable: false, error: null, onClose, onConfirm };
    const { rerender } = render(<ProposalReviewDialog {...props} />);
    const explanation = screen.getByText(/La comunidad podrá apoyar/).textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledOnce();
    rerender(<ProposalReviewDialog {...props} values={{ ...props.values, capacity: '60' }} />);
    expect(screen.getByText(/La comunidad podrá apoyar/)).toHaveTextContent(explanation ?? '');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
