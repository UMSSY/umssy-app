import { describe, expect, it } from 'vitest';
import { proposalLocationError } from './proposal-location-validation';

describe('second QA run location rules', () => {
  const link = 'https://example.org/' + 'a'.repeat(130);
  it('accepts exactly 150 characters and rejects longer virtual links', () => {
    expect(link).toHaveLength(150);
    expect(proposalLocationError(link, 'virtual')).toBeUndefined();
    expect(proposalLocationError(link + 'a', 'virtual')).toBe('Usa hasta 150 caracteres.');
  });
  it.each(['https://example.org/my room', 'https://example.org/my\nroom', ' https://example.org', 'https://example.org '])('rejects whitespace without relying on URL normalization: %s', value => {
    expect(proposalLocationError(value, 'virtual')).toBeDefined();
  });
  it.each(['https://example.org', 'Facultad, https://example.org', 'http://example.org', 'www.example.org, Aula 1', 'meet.google.com/abc, Aula 1'])('rejects links in physical locations: %s', value => {
    expect(proposalLocationError(value, 'presencial')).toBeDefined();
  });
  it.each(['Auditorio central', 'Edificio A, piso 2, Aula 101', 'Av. América, edificio B'])('preserves physical address text and agreed segment rules: %s', value => {
    expect(proposalLocationError(value, 'presencial')).toBeUndefined();
  });
});
