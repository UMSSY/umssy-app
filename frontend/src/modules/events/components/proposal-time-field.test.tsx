
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProposalTimeField } from './proposal-time-field';
import { normalizeProposalTime, proposalTimeSuggestions } from '../utils/proposal-format';
import { isProposalTime } from '../utils/proposal-validation';

afterEach(cleanup);
function Field() {
  const [value, setValue] = useState('');
  return <><ProposalTimeField id="proposal-startTime" label="Hora de inicio" value={value} onChange={setValue}
    error={value && !isProposalTime(value) ? 'Formato inválido' : undefined} /><output data-testid="stored">{value}</output></>;
}
describe('Autofilled workshop times', () => {
  it.each([
    ['08:00 AM', '08:00'], ['02:30 PM', '14:30'], ['12:00 AM', '00:00'],
    ['12:00 PM', '12:00'], ['8:00', '08:00'], ['20:00', '20:00'],
    [' 8:00 a. m. ', '08:00'], ['8:00 p. m.', '20:00'],
    ['13:00 PM', '13:00 PM'], ['24:00', '24:00'], ['08:99', '08:99'],
  ])('normalizes %s without guessing invalid values', (input, expected) => {
    expect(normalizeProposalTime(input)).toBe(expected);
  });
  it.each([['08:00 AM', '08:00', '08:00 AM'], ['02:30 PM', '14:30', '02:30 PM']])('accepts autofill %s on blur', (input, stored, displayed) => {
    render(<Field />);
    const field = screen.getByRole('combobox', { name: /Hora de inicio/ });
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: input } });
    expect(field).toHaveValue(input);
    expect(screen.queryByText('Formato inválido')).not.toBeInTheDocument();
    fireEvent.blur(field);
    expect(screen.getByTestId('stored')).toHaveTextContent(stored);
    expect(field).toHaveValue(displayed);
    expect(screen.queryByText('Formato inválido')).not.toBeInTheDocument();
    fireEvent.focus(field);
    expect(field).toHaveValue(stored);
  });
  it('waits for blur before displaying invalid input feedback', () => {
    render(<Field />);
    const field = screen.getByRole('combobox', { name: /Hora de inicio/ });
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: '08:' } });
    expect(screen.queryByText('Formato inválido')).not.toBeInTheDocument();
    fireEvent.blur(field);
    expect(screen.getByText('Formato inválido')).toBeInTheDocument();
    expect(field).toHaveValue('08:');
  });
});

it('offers only three later times, without crossing midnight', () => {
  expect(proposalTimeSuggestions('08:00')).toEqual(['09:00', '10:00', '11:00']);
  expect(proposalTimeSuggestions('11:30 AM')).toEqual(['12:30', '13:30', '14:30']);
  expect(proposalTimeSuggestions('22:00')).toEqual(['23:00']);
  expect(proposalTimeSuggestions('23:30')).toEqual([]);
  expect(proposalTimeSuggestions('')).toEqual([]);
});
it('renders suggestions with a single time notation', () => {
  const { container } = render(<ProposalTimeField id="end" label="Fin" value="" onChange={() => {}} startTime="08:00" />);
  expect(Array.from(container.querySelectorAll('datalist option')).map(option => option.getAttribute('value'))).toEqual(['09:00 AM', '10:00 AM', '11:00 AM']);
  expect(Array.from(container.querySelectorAll('datalist option')).every(option => !option.textContent)).toBe(true);
});

it('suggests earlier starts when the finish was entered first', () => {
  expect(proposalTimeSuggestions(undefined, '12:00 PM')).toEqual(['09:00', '10:00', '11:00']);
  expect(proposalTimeSuggestions(undefined, '01:00')).toEqual(['00:00']);
  expect(proposalTimeSuggestions(undefined, '00:30')).toEqual([]);
  expect(proposalTimeSuggestions(undefined, 'invalid')).toEqual([]);
  const { container } = render(<ProposalTimeField id="start" label="Inicio" value="" onChange={() => {}} endTime="12:00" />);
  expect(Array.from(container.querySelectorAll('datalist option')).map(option => option.getAttribute('value'))).toEqual(['09:00 AM', '10:00 AM', '11:00 AM']);
});
