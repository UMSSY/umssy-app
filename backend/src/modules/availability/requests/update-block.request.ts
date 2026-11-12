import { createZodDto } from 'nestjs-zod';
import { buildBlockTimeSchema } from './block-time.schema.js';

export const updateBlockSchema = buildBlockTimeSchema(undefined, 'exact');

export class UpdateBlockDto extends createZodDto(updateBlockSchema) {}
