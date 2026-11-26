import type { Prisma } from '../../../prisma/client.js';

export interface FindEventsPayload {
  includeProposals?: boolean;
  categoryId?: string;
  statusId?: string;
  search?: string;
  userId?: string;
  skip?: number;
  take?: number;
  // Filtro de estado y horario armado por el servicio; reemplaza el filtro por estado.
  visibility?: Prisma.EventWhereInput;
  newestFirst?: boolean;
}
