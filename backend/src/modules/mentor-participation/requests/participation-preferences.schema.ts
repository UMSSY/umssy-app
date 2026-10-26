import { z } from 'zod';

const ids = z.array(z.string().uuid()).min(1).refine(
  (values) => new Set(values).size === values.length,
  { message: 'No se permiten identificadores duplicados' },
);

export const participationPreferencesSchema = z.object({
  technicalAreaIds: ids,
  orientationTypeIds: ids,
}).strict();

export type ParticipationPreferencesDto = z.infer<typeof participationPreferencesSchema>;
