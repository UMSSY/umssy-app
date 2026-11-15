export interface ProfileGuideConfettiPiece {
  id: number;
  /** Tailwind classes for color, size and shape. */
  className: string;
  /** Horizontal travel at the peak, in pixels. */
  offsetX: number;
  /** Vertical travel at the peak, in pixels (negative is up). */
  offsetY: number;
  /** Final rotation, in degrees. */
  rotation: number;
  delayMs: number;
}
