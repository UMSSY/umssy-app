import { describe, expect, it } from 'vitest';
import { formatEventLocation } from './format-event-location';

describe('formatEventLocation', () => {
  it('removes only the redundant UMSS suffix from the reported location', () => {
    expect(formatEventLocation('Laboratorio 1, Facultad de Ciencias y Tecnología, UMSS'))
      .toBe('Laboratorio 1, Facultad de Ciencias y Tecnología');
  });

  it.each([
    'Laboratorio 1, Facultad de Ciencias y Tecnología',
    'Aula 101',
    'Campus central, UMSS',
    'Sala A, Edificio B, Zona norte',
    'https://example.com/meeting?location=Sala,Facultad,UMSS',
  ])('preserves valid addresses and links: %s', (location) => {
    expect(formatEventLocation(location)).toBe(location);
  });

  it.each([null, undefined, '', '   '])('handles missing location: %s', (location) => {
    expect(formatEventLocation(location)).toBe('Por confirmar');
  });
});
