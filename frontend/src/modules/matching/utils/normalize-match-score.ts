export function normalizeMatchScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
 
  return Math.round(Math.min(Math.max(score, 0), 100));
}
 
export function formatMatchScore(score: number): string {
  return `${normalizeMatchScore(score)}%`;
}
