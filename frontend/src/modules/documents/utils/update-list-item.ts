export function updateListItem<T>(items: readonly T[] | null | undefined, index: number, changes: Partial<T>): T[] {
  return (items ?? []).map((item, current) => (current === index ? { ...item, ...changes } : item));
}
