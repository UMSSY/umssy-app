import type { z } from 'zod';
import type { recruiterDecisionSchema } from '../requests/recruiter-decision.request.js';

export type RecruiterDecisionRequest = z.infer<typeof recruiterDecisionSchema>;
