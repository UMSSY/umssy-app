export function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function findDuplicatedLabels(labels: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicated = new Set<string>();

  for (const label of labels) {
    const normalized = normalizeLabel(label);
    if (!normalized) continue;
    if (seen.has(normalized)) duplicated.add(normalized);
    seen.add(normalized);
  }

  return [...duplicated];
}
