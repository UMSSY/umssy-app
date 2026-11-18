export interface ElementAnimation {
  animate: (
    element: Element | null,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) => Animation | null;
  isReducedMotion: boolean;
}
