import type { RadarRecruitmentSourcesService } from '../services/radar-recruitment-sources.service.js';
import type { recruiterContactProjection } from '../recruiter-consent.js';
import type { matchRadar } from '../radar-scoring.js';
import type { ApplicationRow } from './application-row.type.js';
import type { RecruiterSnapshot } from './recruiter-snapshot.type.js';

export interface RecruiterCandidateInput {
  application: ApplicationRow;
  user: NonNullable<
    Awaited<ReturnType<RadarRecruitmentSourcesService['candidate']>>
  >;
  latest: RecruiterSnapshot;
  comparison: ReturnType<typeof matchRadar>;
  sharedContact: ReturnType<typeof recruiterContactProjection>;
}
