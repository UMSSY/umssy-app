import type { ReactNode } from 'react';
import type { SkillItem } from '@/modules/skills';
import type { AreaId } from './area-id.types';
import type { Epic2Skill } from './epic2-skill.types';
import type { Projection } from './projection.types';
import type { RadarAreaScore } from './radar-area-score.types';
import type { RadarSimulationEligibility } from './radar-simulation-eligibility.types';

export interface SkillSimulationDialogProps {
  areas: RadarAreaScore[];
  initialArea: AreaId;
  catalog?: readonly SkillItem[];
  approved?: readonly Pick<Epic2Skill, 'id' | 'name'>[];
  verification?: RadarSimulationEligibility;
  verificationError?: boolean;
  onRetry?: () => void;
  onProjectionChange?: (value: Projection) => void;
  availability?: ReactNode;
  onClose: () => void;
}
