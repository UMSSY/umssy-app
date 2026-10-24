import { z } from 'zod';

export const REGISTRATION_BODY_SCHEMA = z.union([z.undefined(), z.strictObject({})]);
