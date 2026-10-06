import type { SeedBlockPlan } from '../../modules/availability/types/seed-block-plan.types.js';
import type { SeedWeeks } from '../../modules/availability/types/seed-weeks.types.js';

export interface SeedSummary {
  weeks: SeedWeeks;
  plan: SeedBlockPlan;
  roles: number;
  statuses: number;
  users: number;
  userRoles: number;
  blocks: number;
  appointments: number;
  legacyRoles: number;
  warnings: string[];
}
