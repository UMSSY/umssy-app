export function isCvSectionFullySelected<T>(selected: readonly T[] = [], available: readonly T[] = []): boolean {
  return available.length > 0 && available.every((item) => selected.includes(item));
}
