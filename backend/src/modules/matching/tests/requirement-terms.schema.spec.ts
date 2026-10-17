import { describe, expect, it } from 'vitest';
import {
  MAX_REQUIREMENT_TEXT_LENGTH,
  requirementTermsBodySchema,
} from '../requests/requirement-terms.schema.js';

describe('requirementTermsBodySchema', () => {
  it.each([['Python y Node.js'], ['']])('acepta el texto %o', (text) => {
    expect(requirementTermsBodySchema.safeParse({ text }).success).toBe(true);
  });

  it('acepta un texto de exactamente el maximo de caracteres', () => {
    const text = 'a'.repeat(MAX_REQUIREMENT_TEXT_LENGTH);

    expect(requirementTermsBodySchema.safeParse({ text }).success).toBe(true);
  });

  it('rechaza un texto que supera el maximo', () => {
    const result = requirementTermsBodySchema.safeParse({
      text: 'a'.repeat(MAX_REQUIREMENT_TEXT_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['text']);
  });

  it.each([[{}], [{ text: null }], [{ text: 42 }]])('rechaza el cuerpo %o', (body) => {
    const result = requirementTermsBodySchema.safeParse(body);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['text']);
  });
});
