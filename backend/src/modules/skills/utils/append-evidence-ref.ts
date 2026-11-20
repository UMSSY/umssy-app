import type { Prisma } from '../../../prisma/client.js';

export function appendEvidenceRef(
  value: unknown,
  ref: string,
): Prisma.InputJsonArray {
  const current = Array.isArray(value) ? (value as Prisma.InputJsonArray) : [];
  return current.includes(ref) ? current : [...current, ref];
}
