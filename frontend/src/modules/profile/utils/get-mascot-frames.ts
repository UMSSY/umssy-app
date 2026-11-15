import {
  PROFILE_GUIDE_FRAME_IDS,
  PROFILE_GUIDE_POSE_FRAMES,
} from '../constants/profile-guide-animation.constants';
import type { MascotFramesInput } from '../types/mascot-frames-input.types';
import type { ProfileGuideFrameId } from '../types/profile-guide-frame-id.types';

/** Frames to mount, in a stable order, so no unused image is downloaded. */
export function getMascotFrames({
  pose,
  previousPose,
  hasFrameAnimation,
  hasStep,
  hasCelebration,
}: MascotFramesInput): ProfileGuideFrameId[] {
  const frames = new Set<ProfileGuideFrameId>(
    hasFrameAnimation ? PROFILE_GUIDE_POSE_FRAMES[pose] : [pose],
  );
  if (previousPose) frames.add(previousPose);
  if (hasStep) frames.add('fly');
  if (hasCelebration) frames.add('celebrate');

  return PROFILE_GUIDE_FRAME_IDS.filter((frame) => frames.has(frame));
}
