export function normalizeLabel(label: string): string {
  return (label ?? "").trim().toLowerCase();
}

export function hasDuplicatedLabels(labels: readonly string[]): boolean {
  const seen = new Set<string>();
  for (const label of labels) {
    const normalized = normalizeLabel(label);
    if (!normalized) continue;
    if (seen.has(normalized)) return true;
    seen.add(normalized);
  }
  return false;
}
