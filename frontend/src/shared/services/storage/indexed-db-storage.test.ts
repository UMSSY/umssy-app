import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDB } from 'idb';
import { createIndexedDbStorage } from './indexed-db-storage';

vi.mock('idb', () => ({ openDB: vi.fn() }));
const get = vi.fn();
const put = vi.fn();
const remove = vi.fn();
const close = vi.fn();
const transaction = vi.fn();
const database = { transaction, close };
const storage = createIndexedDbStorage({ databaseName: 'browser-data', storeName: 'values' });
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(openDB).mockResolvedValue(database as never);
  get.mockResolvedValue(undefined);
  put.mockResolvedValue('key');
  remove.mockResolvedValue(undefined);
  transaction.mockReturnValue({ store: { get, put, delete: remove }, done: Promise.resolve() });
});
afterEach(() => vi.restoreAllMocks());

describe('shared IndexedDB storage', () => {
  it('preserves existing stores during upgrade and creates missing ones', async () => {
    await storage.read('key');
    const options = vi.mocked(openDB).mock.calls[0][2];
    const existing = { objectStoreNames: { contains: vi.fn().mockReturnValue(true) }, createObjectStore: vi.fn() };
    const missing = { objectStoreNames: { contains: vi.fn().mockReturnValue(false) }, createObjectStore: vi.fn() };
    options?.upgrade?.(existing as never, 0, 1, {} as never, {} as never);
    options?.upgrade?.(missing as never, 0, 1, {} as never, {} as never);
    expect(existing.createObjectStore).not.toHaveBeenCalled();
    expect(missing.createObjectStore).toHaveBeenCalledWith('values');
  });

  it('reads a stored value and closes the connection', async () => {
    get.mockResolvedValue({ title: 'Existing draft' });
    expect(await storage.read('user')).toEqual({ title: 'Existing draft' });
    expect(openDB).toHaveBeenCalledWith('browser-data', 1, expect.any(Object));
    expect(transaction).toHaveBeenCalledWith('values', 'readonly');
    expect(get).toHaveBeenCalledWith('user');
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('waits for write commit before reporting success or closing', async () => {
    let commit!: () => void;
    transaction.mockReturnValue({ store: { put }, done: new Promise<void>((resolve) => { commit = resolve; }) });
    const finished = vi.fn();
    const writing = storage.write('user', { file: 'draft' }).then(finished);
    await vi.waitFor(() => expect(put).toHaveBeenCalledWith({ file: 'draft' }, 'user'));
    expect(finished).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    commit();
    await writing;
    expect(finished).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('removes a key without clearing unrelated data', async () => {
    await storage.remove('user');
    expect(transaction).toHaveBeenCalledWith('values', 'readwrite');
    expect(remove).toHaveBeenCalledWith('user');
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('propagates transaction failures and still closes the database', async () => {
    const failure = new Error('Transaction aborted');
    transaction.mockImplementation(() => ({ store: { put }, done: Promise.reject(failure) }));
    await expect(storage.write('user', {})).rejects.toThrow('Transaction aborted');
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('propagates unavailable browser storage without masking the failure', async () => {
    vi.mocked(openDB).mockRejectedValue(new Error('IndexedDB unavailable'));
    await expect(storage.read('user')).rejects.toThrow('IndexedDB unavailable');
    expect(close).not.toHaveBeenCalled();
  });
});
