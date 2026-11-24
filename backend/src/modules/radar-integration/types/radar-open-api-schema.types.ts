import type { ApiBodyOptions } from '@nestjs/swagger';

export type RadarOpenApiSchema = Extract<
  ApiBodyOptions,
  { schema: unknown }
>['schema'];
