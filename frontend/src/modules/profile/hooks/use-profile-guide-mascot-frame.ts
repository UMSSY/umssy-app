'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  PROFILE_GUIDE_BLINK_INTERVALS_MS,
  PROFILE_GUIDE_DURATIONS_MS,
  PROFILE_GUIDE_TALK_INTERVALS_MS,
  PROFILE_GUIDE_WAVE_CYCLES,
  PROFILE_GUIDE_WAVE_SEQUENCE,
} from '../constants/profile-guide-animation.constants';
import type { MascotFrameMode } from '../types/mascot-frame-mode.types';
import type { MascotFrameOptions } from '../types/mascot-frame-options.types';
import type { ProfileGuideFrameId } from '../types/profile-guide-frame-id.types';

const GREETING_FRAMES: ProfileGuideFrameId[] = Array.from(
  { length: PROFILE_GUIDE_WAVE_CYCLES },
  () => PROFILE_GUIDE_WAVE_SEQUENCE,
).flat();

function subscribeToVisibility(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

function getIsDocumentVisible(): boolean {
  return document.visibilityState !== 'hidden';
}

function getServerIsDocumentVisible(): boolean {
  return true;
}

/**
 * Frame-by-frame animation of the wave pose: greeting cycle, blinking and
 * talking. It runs on chained timeouts that stop while the frames are disabled
 * or the tab is hidden.
 */
export function useProfileGuideMascotFrame({
  isEnabled,
  isTalking,
}: MascotFrameOptions) {
  const isVisible = useSyncExternalStore(
    subscribeToVisibility,
    getIsDocumentVisible,
    getServerIsDocumentVisible,
  );
  const [isGreeting, setIsGreeting] = useState(false);
  const [shown, setShown] = useState<{
    frame: ProfileGuideFrameId;
    mode: MascotFrameMode;
  }>({ frame: 'wave', mode: 'idle' });

  // A greeting never survives a pose change or a talk: it is dropped instead
  // of replaying later.
  const resetKey = `${isEnabled}:${isTalking}`;
  const [seenResetKey, setSeenResetKey] = useState(resetKey);
  if (seenResetKey !== resetKey) {
    setSeenResetKey(resetKey);
    setIsGreeting(false);
  }

  let mode: MascotFrameMode = 'blinking';
  if (!isEnabled || !isVisible) mode = 'idle';
  else if (isTalking) mode = 'talking';
  else if (isGreeting) mode = 'greeting';

  useEffect(() => {
    if (mode === 'idle') return;

    let timer = 0;
    let index = 0;
    const show = (frame: ProfileGuideFrameId) => setShown({ frame, mode });

    if (mode === 'greeting') {
      const advance = () => {
        index += 1;
        show(GREETING_FRAMES[index]);
        if (index < GREETING_FRAMES.length - 1) {
          timer = window.setTimeout(advance, PROFILE_GUIDE_DURATIONS_MS.waveFrame);
        } else {
          setIsGreeting(false);
        }
      };
      timer = window.setTimeout(advance, PROFILE_GUIDE_DURATIONS_MS.waveFrame);
    } else if (mode === 'talking') {
      const toggle = () => {
        show(index % 2 === 0 ? 'talk' : 'wave');
        timer = window.setTimeout(
          toggle,
          PROFILE_GUIDE_TALK_INTERVALS_MS[
            index % PROFILE_GUIDE_TALK_INTERVALS_MS.length
          ],
        );
        index += 1;
      };
      timer = window.setTimeout(toggle, 0);
    } else {
      const wait = () => {
        timer = window.setTimeout(
          () => {
            show('blink');
            timer = window.setTimeout(() => {
              show('wave');
              index += 1;
              wait();
            }, PROFILE_GUIDE_DURATIONS_MS.blink);
          },
          PROFILE_GUIDE_BLINK_INTERVALS_MS[
            index % PROFILE_GUIDE_BLINK_INTERVALS_MS.length
          ],
        );
      };
      wait();
    }

    return () => window.clearTimeout(timer);
  }, [mode]);

  const playGreeting = useCallback(() => setIsGreeting(true), []);
  const frame: ProfileGuideFrameId = shown.mode === mode ? shown.frame : 'wave';

  return { frame, playGreeting };
}
