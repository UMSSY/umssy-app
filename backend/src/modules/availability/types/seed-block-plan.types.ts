import type { SeedBlock } from './seed-block.types.js';

export interface SeedBlockPlan {
  blocks: SeedBlock[];
  free: SeedBlock;
  current: SeedBlock;
  next: SeedBlock;
  past: SeedBlock;
  blocked: SeedBlock;
  blockedOn: Date;
  warnings: string[];
}
