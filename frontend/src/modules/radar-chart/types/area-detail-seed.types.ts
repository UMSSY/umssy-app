import type { AreaDetail } from './area-detail.types';

export type AreaDetailSeed = Omit<
  AreaDetail,
  'level' | 'globalAverage' | 'gap'
>;
