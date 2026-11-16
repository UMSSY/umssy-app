import { z } from 'zod';

// The pass QR contains v1:<token>; manual entry accepts the same token without its prefix.
const REFERENCE_PATTERN = /^(?:v1:)?[a-f0-9]{64}$/i;

export const AttendanceCheckInBodySchema = z.strictObject({
  reference: z.string().trim().regex(REFERENCE_PATTERN).transform((value) =>
    value.replace(/^v1:/i, '').toLowerCase(),
  ),
});

export const AttendanceCheckInParamsSchema = z.object({
  eventId: z.guid(),
});

export type AttendanceCheckInBody = z.infer<typeof AttendanceCheckInBodySchema>;
export type AttendanceCheckInParams = z.infer<typeof AttendanceCheckInParamsSchema>;
