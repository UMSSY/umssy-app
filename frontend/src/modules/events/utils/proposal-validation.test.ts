import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_PROPOSAL, PROPOSAL_COVER_MAX_BYTES } from '../constants/proposal.constants';
import { validateProposal, validateProposalCover } from './proposal-validation';
import { formatProposalDuration, formatProposalTime } from './proposal-format';

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-24T12:00:00Z')); });
afterEach(() => vi.useRealTimers());

const cover = new File(['image'], 'cover.png', { type: 'image/png' });
const values = { ...EMPTY_PROPOSAL, title: 'Python', description: 'Taller práctico', categoryId: 'cat', eventDate: '2026-11-12', startTime: '09:00', endTime: '12:00', capacity: '30', location: 'Aula 1' };

describe('Proposal validation', () => {
  it('requires all input, including a cover and the approved capacity range', () => {
    expect(validateProposal(values, cover, ['cat'])).toEqual({});
    expect(validateProposal({ ...values, capacity: '1' }, cover, ['cat'])).toHaveProperty('capacity');
    expect(Object.keys(validateProposal(EMPTY_PROPOSAL, null, ['cat']))).toEqual(expect.arrayContaining(['title', 'description', 'categoryId', 'eventDate', 'startTime', 'endTime', 'capacity', 'location', 'cover']));
  });
  it.each(['20', '60'])('accepts the capacity boundary %s', (capacity) => {
    expect(validateProposal({ ...values, capacity }, cover, ['cat'])).toEqual({});
  });
  it.each(['2026-11-03', '2027-04-24'])('accepts the date boundary %s', (eventDate) => {
    expect(validateProposal({ ...values, eventDate }, cover, ['cat'])).toEqual({});
  });
  it.each(['2026-11-02', '2027-04-25', '2027-02-30'])('rejects an out-of-range or impossible date %s', (eventDate) => {
    expect(validateProposal({ ...values, eventDate }, cover, ['cat'])).toHaveProperty('eventDate');
  });
  it('enforces exact text boundaries and rejects whitespace-only content', () => {
    expect(validateProposal({ ...values, title: 'x'.repeat(80), description: 'x'.repeat(300) }, cover, ['cat'])).toEqual({});
    expect(validateProposal({ ...values, title: 'x'.repeat(81), description: 'x'.repeat(301) }, cover, ['cat'])).toHaveProperty('title');
    expect(validateProposal({ ...values, title: ' ', description: '\n ' }, cover, ['cat'])).toHaveProperty('description');
  });
  it.each(['0', '-1', '2.5', '1e2', '19', '61', '2147483648'])('rejects invalid capacity %s', (capacity) => {
    expect(validateProposal({ ...values, capacity }, cover, ['cat'])).toHaveProperty('capacity');
  });
  it('rejects unavailable categories, impossible dates and reversed times', () => {
    expect(validateProposal({ ...values, eventDate: '2026-02-30', endTime: '08:00' }, cover, [])).toMatchObject({ eventDate: expect.any(String), endTime: expect.any(String), categoryId: expect.any(String) });
  });
  it('requires an HTTP(S) link only for virtual workshops', () => {
    expect(validateProposal({ ...values, modality: 'virtual' }, cover, ['cat'])).toHaveProperty('location');
    expect(validateProposal({ ...values, modality: 'virtual', location: 'javascript:alert(1)' }, cover, ['cat'])).toHaveProperty('location');
    expect(validateProposal({ ...values, modality: 'virtual', location: 'https://meet.example.org/workshop' }, cover, ['cat'])).toEqual({});
  });
  it('rejects unsupported, empty and oversized images', () => {
    expect(validateProposalCover(new File(['svg'], 'cover.svg', { type: 'image/svg+xml' }))).toMatch(/JPG/);
    expect(validateProposalCover(new File([], 'empty.png', { type: 'image/png' }))).toMatch(/vacía/);
    expect(validateProposalCover(new File([new Uint8Array(PROPOSAL_COVER_MAX_BYTES + 1)], 'large.png', { type: 'image/png' }))).toMatch(/5 MB/);
  });
});

describe('Proposal local-time display', () => {
  it.each([['00:00', '12:00 AM'], ['09:05', '09:05 AM'], ['12:00', '12:00 PM'], ['15:30', '03:30 PM'], ['23:59', '11:59 PM']])('formats %s as %s', (input, expected) => {
    expect(formatProposalTime(input)).toBe(expected);
  });
  it('shows duration only for a valid same-day interval', () => {
    expect(formatProposalDuration('09:00', '12:00')).toBe('3 horas');
    expect(formatProposalDuration('09:00', '10:30')).toBe('1 hora 30 min');
    expect(formatProposalDuration('12:00', '09:00')).toBeNull();
    expect(formatProposalDuration('', '')).toBeNull();
  });
});
