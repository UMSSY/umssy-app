export function getRadarSchemaExample(
  schema: Record<string, unknown>,
): unknown {
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum)) return schema.enum[0];
  if (schema.const !== undefined) return schema.const;
  if (schema.nullable) return null;
  if (schema.type === 'array') return [];
  if (schema.type === 'boolean') return true;
  if (schema.type === 'number' || schema.type === 'integer')
    return schema.minimum ?? 0;
  if (schema.type === 'string') return 'Ejemplo';
  if (schema.properties && typeof schema.properties === 'object') {
    return Object.fromEntries(
      Object.entries(schema.properties).map(([name, property]) => [
        name,
        property && typeof property === 'object'
          ? getRadarSchemaExample(property as Record<string, unknown>)
          : null,
      ]),
    );
  }
  return null;
}
