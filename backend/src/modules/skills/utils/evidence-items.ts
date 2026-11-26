import type { Prisma } from '../../../prisma/client.js';

export function evidenceItems(value: unknown): Prisma.InputJsonArray {
  return Array.isArray(value) ? (value as Prisma.InputJsonArray) : [];
}
