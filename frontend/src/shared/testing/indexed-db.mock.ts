import { afterEach, vi } from 'vitest';
import { clearAccessToken } from '../services/storage/access-token-storage';

const { values } = vi.hoisted(() => ({ values: new Map<string, unknown>() }));

vi.mock('@/shared/services/storage/browser-indexed-db', () => ({
  readIndexedDb: vi.fn(async (key: string) => values.get(key) ?? null),
  writeIndexedDb: vi.fn(async (key: string, value: unknown) => {
    values.set(key, structuredClone(value));
  }),
  removeIndexedDb: vi.fn(async (key: string) => {
    values.delete(key);
  }),
  readIndexedDbPair: vi.fn(async (primary: string, secondary: string) => [
    structuredClone(values.get(primary)),
    structuredClone(values.get(secondary)),
  ]),
  updateIndexedDbPair: vi.fn(
    async (
      primary: string,
      secondary: string,
      update: (
        primary: unknown,
        secondary: unknown,
      ) => {
        primary?: unknown;
        secondary?: unknown;
      },
    ) => {
      const next = update(values.get(primary), values.get(secondary));
      for (const [key, value] of [
        [primary, next.primary],
        [secondary, next.secondary],
      ] as const) {
        if (value === null) values.delete(key);
        else if (value !== undefined) values.set(key, structuredClone(value));
      }
    },
  ),
  updateIndexedDb: vi.fn(
    async (key: string, update: (value: unknown) => unknown) => {
      const value = update(values.get(key) ?? null);
      if (value === null) values.delete(key);
      else values.set(key, structuredClone(value));
      return value;
    },
  ),
  removeIndexedDbByPrefix: vi.fn(async (prefix: string) => {
    for (const key of values.keys())
      if (key.startsWith(prefix)) values.delete(key);
  }),
}));

afterEach(() => {
  clearAccessToken();
  values.clear();
});
