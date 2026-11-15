export interface ElementAnimation {
  /** Returns null with reduced motion or when the browser cannot animate. */
  animate: (
    element: Element | null,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) => Animation | null;
  isReducedMotion: boolean;
}
