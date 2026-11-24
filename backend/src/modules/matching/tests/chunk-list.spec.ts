import { describe, expect, it } from 'vitest';
import { chunkList } from '../utils/chunk-list.js';

describe('chunkList', () => {
  it('parte la lista en lotes del tamaño pedido', () => {
    expect(chunkList([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('devuelve un solo lote cuando la lista cabe', () => {
    expect(chunkList([1, 2], 10)).toEqual([[1, 2]]);
  });

  it('devuelve ningún lote para una lista vacía', () => {
    expect(chunkList([], 3)).toEqual([]);
  });

  it.each([0, -1])('rechaza el tamaño %i', (size) => {
    expect(() => chunkList([1], size)).toThrow(RangeError);
  });
});
