import { describe, expect, it } from 'vitest';
import { countCharacters } from './unicode-counter.js';

describe('countCharacters', () => {
  it('returns 0 for empty or nullish string', () => {
    expect(countCharacters('')).toBe(0);
    expect(countCharacters(undefined as unknown as string)).toBe(0);
  });

  it('counts standard ASCII characters', () => {
    expect(countCharacters('hola')).toBe(4);
    expect(countCharacters('a'.repeat(500))).toBe(500);
  });

  it('counts simple emojis as 1 character each', () => {
    expect(countCharacters('😀')).toBe(1);
    expect(countCharacters('😀😁😂')).toBe(3);
    expect(countCharacters('😀'.repeat(250))).toBe(250);
    expect(countCharacters('😀'.repeat(251))).toBe(251);
    expect(countCharacters('😀'.repeat(500))).toBe(500);
  });

  it('counts compound emojis (skin tones, flags, variation selectors) as 1 character each', () => {
    expect(countCharacters('👍🏽')).toBe(1);
    expect(countCharacters('🇧🇴')).toBe(1);
    expect(countCharacters('❣️')).toBe(1);
    expect(countCharacters('❤️')).toBe(1);
    expect(countCharacters('👨‍👩‍👧‍👦')).toBe(1);
    expect(countCharacters('🏳️‍🌈')).toBe(1);
    expect(countCharacters('#️⃣')).toBe(1);
  });

  it('counts 250, 251 and 500 flags (🇧🇴) and hearts (❣️) accurately as 1 per emoji', () => {
    expect(countCharacters('🇧🇴'.repeat(250))).toBe(250);
    expect(countCharacters('🇧🇴'.repeat(251))).toBe(251);
    expect(countCharacters('🇧🇴'.repeat(500))).toBe(500);

    expect(countCharacters('❣️'.repeat(250))).toBe(250);
    expect(countCharacters('❣️'.repeat(251))).toBe(251);
    expect(countCharacters('❣️'.repeat(500))).toBe(500);
  });

  it('counts mixed text and emojis accurately', () => {
    const mixed = 'a'.repeat(250) + '❣️'.repeat(250);
    expect(countCharacters(mixed)).toBe(500);
  });
});
