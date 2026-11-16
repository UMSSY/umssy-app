import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { toApiBody } from '../utils/to-api-body.js';

const requestSchema = z.object({ name: z.string() });

function bodySchemaOf(example?: unknown): Record<string, unknown> {
  const body = toApiBody(requestSchema, example) as {
    schema: Record<string, unknown>;
  };
  return body.schema;
}

describe('toApiBody', () => {
  it('describe el esquema de entrada sin el dialecto', () => {
    const schema = bodySchemaOf();

    expect(schema).toMatchObject({ type: 'object' });
    expect(schema).not.toHaveProperty('$schema');
  });

  it('agrega el ejemplo cuando se indica', () => {
    expect(bodySchemaOf({ name: 'Power BI' })).toMatchObject({
      example: { name: 'Power BI' },
    });
  });

  it('no agrega la propiedad example sin ejemplo', () => {
    expect(bodySchemaOf()).not.toHaveProperty('example');
  });
});
