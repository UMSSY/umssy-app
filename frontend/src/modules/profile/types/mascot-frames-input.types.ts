import type { ProfileGuidePose } from './profile-guide-pose.types';

export interface MascotFramesInput {
  pose: ProfileGuidePose;
  previousPose: ProfileGuidePose | null;
  hasFrameAnimation: boolean;
  hasStep: boolean;
  hasCelebration: boolean;
}
