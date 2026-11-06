import type { Prisma } from '../../../prisma/client.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';

export function withMentorCapacityLock<T>(prisma: PrismaService, operation: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL TIME ZONE 'UTC'`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(1436)::text`;
    return operation(tx);
  }, { isolationLevel: 'ReadCommitted', maxWait: 10_000, timeout: 30_000 });
}
