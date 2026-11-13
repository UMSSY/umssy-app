import type { ProfileGuidePose } from './profile-guide-pose.types';

export interface MascotFramesInput {
  pose: ProfileGuidePose;
  /** Pose that is fading out, kept mounted until the crossfade ends. */
  previousPose: ProfileGuidePose | null;
  hasFrameAnimation: boolean;
  hasStep: boolean;
  hasCelebration: boolean;
}
