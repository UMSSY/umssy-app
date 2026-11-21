export function resolveSelectedItems<T extends { id: string }>(
  catalog: T[],
  draftIds: string[] | null,
  savedIds: string[],
): T[] {
  const selectedIds = new Set(draftIds ?? savedIds);
  return catalog.filter((item) => selectedIds.has(item.id));
}