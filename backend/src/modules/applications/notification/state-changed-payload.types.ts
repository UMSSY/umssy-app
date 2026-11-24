import type { z } from 'zod';
import type { StateChangedDto } from './state-changed.dto.js';

export type StateChangedPayload = z.infer<typeof StateChangedDto>;
