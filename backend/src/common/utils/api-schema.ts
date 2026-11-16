export type ApiSchema = Record<string, unknown>;

export function apiString(example: string, extra: ApiSchema = {}): ApiSchema {
  return { type: 'string', example, ...extra };
}

export function apiUuid(example: string): ApiSchema {
  return apiString(example, { format: 'uuid' });
}

export function apiDate(example: string): ApiSchema {
  return apiString(example, { format: 'date' });
}

export function apiDateTime(example: string): ApiSchema {
  return apiString(example, { format: 'date-time' });
}

export function apiInteger(example: number, extra: ApiSchema = {}): ApiSchema {
  return { type: 'integer', example, ...extra };
}

export function apiBoolean(example: boolean): ApiSchema {
  return { type: 'boolean', example };
}

export function apiEnum(values: readonly string[], example: string): ApiSchema {
  return { type: 'string', enum: [...values], example };
}

export function apiNullable(
  schema: ApiSchema,
  example: unknown = schema.example ?? null,
): ApiSchema {
  return { ...schema, nullable: true, example };
}

export function apiArray(items: ApiSchema): ApiSchema {
  return { type: 'array', items };
}

export function apiObject(
  properties: Record<string, ApiSchema>,
  optional: readonly string[] = [],
): ApiSchema {
  return {
    type: 'object',
    properties,
    required: Object.keys(properties).filter((key) => !optional.includes(key)),
  };
}

export function apiExampleOf(schema: ApiSchema): unknown {
  if ('example' in schema) return schema.example;
  if (schema.type === 'array') {
    return [apiExampleOf(schema.items as ApiSchema)];
  }
  if (schema.type === 'object') {
    const properties = schema.properties as Record<string, ApiSchema>;
    return Object.fromEntries(
      Object.entries(properties).map(([key, property]) => [
        key,
        apiExampleOf(property),
      ]),
    );
  }
  return undefined;
}
