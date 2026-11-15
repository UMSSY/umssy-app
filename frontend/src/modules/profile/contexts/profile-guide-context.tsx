'use client';

import { createContext, useContext } from 'react';
import type { ProfileGuideContextValue } from '../types/profile-guide-context-value.types';

export const ProfileGuideContext =
  createContext<ProfileGuideContextValue | null>(null);

export function useProfileGuide() {
  return useContext(ProfileGuideContext);
}
