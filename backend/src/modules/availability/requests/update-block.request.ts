import { createZodDto } from 'nestjs-zod';
import { buildBlockTimeSchema } from './block-time.schema.js';

export const updateBlockSchema = buildBlockTimeSchema();

export class UpdateBlockDto extends createZodDto(updateBlockSchema) {}
