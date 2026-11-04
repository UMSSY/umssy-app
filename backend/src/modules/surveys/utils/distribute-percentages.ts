const PERCENTAGE_SCALE = 1000;

export function distributePercentages(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total <= 0) return counts.map(() => 0);

  const shares = counts.map((count, index) => ({
    index,
    tenths: Math.floor((count * PERCENTAGE_SCALE) / total),
    remainder: (count * PERCENTAGE_SCALE) % total,
  }));
  const assigned = shares.reduce((sum, share) => sum + share.tenths, 0);
  const leftover = PERCENTAGE_SCALE - assigned;

  [...shares]
    .sort(
      (first, second) =>
        second.remainder - first.remainder || first.index - second.index,
    )
    .slice(0, leftover)
    .forEach((share) => {
      share.tenths += 1;
    });

  return shares.map((share) => share.tenths / 10);
}
