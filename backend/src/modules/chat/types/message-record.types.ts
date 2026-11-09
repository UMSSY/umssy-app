import type { Prisma } from '../../../prisma/client.js';
import type { MESSAGE_RELATIONS } from '../constants/message-relations.constants.js';

export type MessageRecord = Prisma.MessageGetPayload<{
  include: typeof MESSAGE_RELATIONS;
}>;
