import type { z } from 'zod';
import type { CreateProposalSchema } from '../requests/create-proposal.request.js';

export type CreateProposalPayload = z.infer<typeof CreateProposalSchema>;
