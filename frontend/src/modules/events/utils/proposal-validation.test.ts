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
    expect(validateProposal({ ...values, title: 'ab'.repeat(40), description: 'ab'.repeat(150) }, cover, ['cat'])).toEqual({});
    expect(validateProposal({ ...values, title: 'x'.repeat(81), description: 'x'.repeat(301) }, cover, ['cat'])).toHaveProperty('title');
    expect(validateProposal({ ...values, title: ' ', description: '\n ' }, cover, ['cat'])).toHaveProperty('description');
  });
  it.each(['0', '-1', '2.5', '1e2', '19', '61', '2147483648'])('rejects invalid capacity %s', (capacity) => {
    expect(validateProposal({ ...values, capacity }, cover, ['cat'])).toHaveProperty('capacity');
  });
  it('rejects unavailable categories, impossible dates and reversed times', () => {
    expect(validateProposal({ ...values, eventDate: '2026-02-30', endTime: '08:00' }, cover, [])).toMatchObject({ eventDate: expect.any(String), endTime: expect.any(String), categoryId: expect.any(String) });
  });
  it('requires an HTTPS link only for virtual workshops', () => {
    expect(validateProposal({ ...values, modality: 'virtual' }, cover, ['cat'])).toHaveProperty('location');
    expect(validateProposal({ ...values, modality: 'virtual', location: 'javascript:alert(1)' }, cover, ['cat'])).toHaveProperty('location');
    expect(validateProposal({ ...values, modality: 'virtual', location: 'https://meet.example.org/workshop' }, cover, ['cat'])).toEqual({});
  });
  it.each(['', '   ', '... ---', 'a'.repeat(151)])('rejects invalid physical location %s', (location) => {
    expect(validateProposal({ ...values, location }, cover, ['cat'])).toHaveProperty('location');
  });
  it.each(['Auditorio central', 'Edificio de Tecnología, piso 2, laboratorio 1', 'a'.repeat(150)])('accepts physical location %s', (location) => {
    expect(validateProposal({ ...values, location }, cover, ['cat'])).not.toHaveProperty('location');
  });
  it('rejects unsupported, empty and oversized images', () => {
    expect(validateProposalCover(new File(['svg'], 'cover.svg', { type: 'image/svg+xml' }))).toMatch(/JPG/);
    expect(validateProposalCover(new File([], 'empty.png', { type: 'image/png' }))).toMatch(/vacía/);
    expect(validateProposalCover(new File([new Uint8Array(PROPOSAL_COVER_MAX_BYTES + 1)], 'large.png', { type: 'image/png' }))).toMatch(/2 MB/);
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

describe('Basic proposal text validation', () => {
  it.each(['   ', '12345', '!!!', '123 - !!!', 'aaaaaa', 'A a A a', 'ññññ'])('rejects non-text or repeated content: %s', (text) => {
    expect(validateProposal({ ...values, title: text, description: text }, cover, ['cat'])).toMatchObject({ title: expect.any(String), description: expect.any(String) });
  });
  it.each(['C++', 'C# y .NET', 'Diseño UX/UI', 'Python 3: introducción', 'Excel', 'Línea uno.\nLínea dos.'])('accepts useful punctuation and letters: %s', (text) => {
    expect(validateProposal({ ...values, title: text, description: text }, cover, ['cat'])).toEqual({});
  });
});

it('accepts an image at the 2 MiB upload limit', () => {
  expect(validateProposalCover(new File([new Uint8Array(2 * 1024 * 1024)], 'cover.png', { type: 'image/png' }))).toBeNull();
});

describe('Location and meeting link structure', () => {
  it.each([
    ['presencial', ', Auditorio central'],
    ['presencial', 'Edificio B,'],
    ['presencial', 'Edificio B,, aula 2'],
    ['presencial', 'Edificio B, , aula 2'],
    ['presencial', 'Edificio B, !!!, aula 2'],
    ['presencial', '12345'],
    ['virtual', 'http://meet.example.org/room'],
    ['virtual', 'meet.example.org/room'],
    ['virtual', 'https:/meet.example.org/room'],
    ['virtual', 'https:///meet.example.org/room'],
    ['virtual', 'https://'],
    ['virtual', 'https://meet.example.org/my room'],
    ['virtual', 'https://user:password@meet.example.org/room'],
    ['virtual', 'https://meet.example.org/' + 'a'.repeat(2000)],
  ] as const)('rejects %s malformed input: %s', (modality, location) => {
    expect(validateProposal({ ...values, location, modality }, cover, ['cat'])).toHaveProperty('location');
  });
});

describe('Physical location segment limit', () => {
  it.each([
    ['Auditorio central', true],
    ['Facultad de Tecnología, edificio B, piso 2, aula 204', true],
    ['Facultad de Tecnología, edificio B, piso 2, aula 204, puerta norte', false],
  ] as const)('validates segment count: %s', (location, accepted) => {
    expect(Boolean(validateProposal({ ...values, location }, cover, ['cat']).location)).toBe(!accepted);
  });
});

describe('Specific location feedback', () => {
  it.each([
    ['presencial', '', 'Escribe la ubicación del taller.'],
    ['presencial', '123', 'Incluye el nombre del lugar.'],
    ['presencial', ', Aula 1', 'Quita la coma del inicio o del final.'],
    ['presencial', 'Edificio A, , aula 1', 'Completa o elimina la parte vacía entre comas.'],
    ['presencial', 'Edificio A, !!!', 'Reemplaza los símbolos por un lugar o referencia.'],
    ['presencial', 'A, B, C, D, E', 'Usa hasta 4 partes separadas por comas.'],
    ['virtual', '', 'Pega el enlace de la reunión.'],
    ['virtual', 'http://example.org', 'El enlace debe comenzar con https://.'],
    ['virtual', 'https://example.org/my room', 'Quita los espacios del enlace.'],
    ['virtual', 'https://', 'Completa la dirección después de https://.'],
    ['virtual', 'https://user:pass@example.org', 'Usa un enlace sin usuario ni contraseña incluidos.'],
    ['virtual', 'https://[invalid', 'Revisa la dirección del enlace.'],
  ] as const)('explains %s input %s', (modality, location, message) => {
    expect(validateProposal({ ...values, modality, location }, cover, ['cat']).location).toBe(message);
  });
});
