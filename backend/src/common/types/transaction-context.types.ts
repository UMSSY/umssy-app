import type { Prisma } from '../../prisma/client.js';

// Los servicios propagan el contexto; solo los repositorios acceden al cliente.
export interface TransactionContext {
  readonly client: Prisma.TransactionClient;
}
