import type { ApiBodyOptions } from '@nestjs/swagger';
import { z, type ZodType } from 'zod';

// Documents a Zod request schema in Swagger: @ApiBody(toApiBody(schema)).
export function toApiBody(schema: ZodType, example?: unknown): ApiBodyOptions {
  const { $schema: _dialect, ...jsonSchema } = z.toJSONSchema(schema, {
    io: 'input',
  });
  return {
    schema: example === undefined ? jsonSchema : { ...jsonSchema, example },
  } as ApiBodyOptions;
}
