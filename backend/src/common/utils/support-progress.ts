export function calculateSupportsRemaining(
  supportCount: number,
  threshold: number | null,
): number {
  return Math.max(0, (threshold ?? 0) - supportCount);
}

export function calculateProgressPercent(
  supportCount: number,
  threshold: number | null,
): number {
  if (!threshold || threshold <= 0) return 0;
  return Math.min(100, Math.round((supportCount / threshold) * 100));
}