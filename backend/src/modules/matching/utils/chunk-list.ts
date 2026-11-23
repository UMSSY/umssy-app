export function chunkList<T>(items: readonly T[], size: number): T[][] {
  if (size < 1) throw new RangeError('El tamaño del lote debe ser mayor a cero');
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}
