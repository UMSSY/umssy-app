import type { ZodType } from 'zod';

export interface RadarEndpointOptions {
  operationId: string;
  summary: string;
  description: string;
  response?: ZodType;
  status?: number;
  errors?: readonly number[];
  binary?: boolean;
  mime?: string;
  parameters?: readonly string[];
}
