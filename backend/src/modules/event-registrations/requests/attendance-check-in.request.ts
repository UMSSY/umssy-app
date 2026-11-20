import { z } from 'zod';

const QR_REFERENCE_PATTERN = /^(?:v1:)?[a-f0-9]{64}$/i;
const QrReferenceSchema = z.string().trim().regex(QR_REFERENCE_PATTERN).transform((value) => ({
  kind: 'qrToken' as const,
  value: value.replace(/^v1:/i, '').toLowerCase(),
}));
const RegistrationIdReferenceSchema = z.string().trim().pipe(z.guid()).transform((value) => ({
  kind: 'registrationId' as const,
  value: value.toLowerCase(),
}));

export const AttendanceCheckInBodySchema = z.strictObject({
  reference: z.union([QrReferenceSchema, RegistrationIdReferenceSchema]),
});

export const AttendanceCheckInParamsSchema = z.object({
  eventId: z.guid(),
});

export type AttendanceCheckInBody = z.infer<typeof AttendanceCheckInBodySchema>;
export type AttendanceReference = AttendanceCheckInBody['reference'];
export type AttendanceCheckInParams = z.infer<typeof AttendanceCheckInParamsSchema>;
