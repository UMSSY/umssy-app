import type { SchemaObject } from '@nestjs/swagger';

export interface MentorApiOperationOptions {
  operationId: string;
  summary: string;
  description: string;
  data: SchemaObject;
  example: unknown;
  status?: number;
  auth?: boolean;
  errors?: number[];
  errorDescriptions?: Record<number, string>;
}
