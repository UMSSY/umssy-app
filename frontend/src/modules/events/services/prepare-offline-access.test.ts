import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { prepareOfflineAccess } from './prepare-offline-access';

const tasks = vi.hoisted(() => ({
  shell: vi.fn(),
  passes: vi.fn(),
  events: vi.fn(),
  session: vi.fn(),
}));
vi.mock('@/modules/auth', () => ({
  authService: { getSession: tasks.session },
}));
vi.mock('@/shared/services/service-worker/prepare-offline-shell', () => ({
  prepareOfflineShell: tasks.shell,
}));
vi.mock('./prepare-offline-passes', () => ({
  prepareOfflinePasses: tasks.passes,
}));
vi.mock('./prepare-offline-events', () => ({
  prepareOfflineEvents: tasks.events,
}));

beforeEach(() => {
  vi.useFakeTimers();
  for (const task of Object.values(tasks))
    task.mockReset().mockResolvedValue(undefined);
});
afterEach(() => vi.useRealTimers());

it('reports readiness after every required task completes', async () => {
  await expect(
    prepareOfflineAccess('account', new AbortController().signal),
  ).resolves.toBe(true);
  expect(tasks.session).toHaveBeenCalledWith(
    'account',
    expect.any(AbortSignal),
    true,
  );
  expect(vi.getTimerCount()).toBe(0);
});

it('ends preparation after a minute even if a storage operation never settles', async () => {
  tasks.events.mockReturnValue(new Promise(() => {}));
  const result = prepareOfflineAccess('account', new AbortController().signal);
  const rejection = expect(result).rejects.toThrow(
    'La descarga tardó demasiado',
  );
  await vi.advanceTimersByTimeAsync(60_000);
  await rejection;
  expect(tasks.events.mock.calls[0][1].aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it('cancels sibling requests after a failure and allows a later retry', async () => {
  tasks.passes.mockRejectedValueOnce(new Error('Storage full'));
  await expect(
    prepareOfflineAccess('account', new AbortController().signal),
  ).rejects.toThrow('Storage full');
  expect(tasks.events.mock.calls[0][1].aborted).toBe(true);
  await expect(
    prepareOfflineAccess('account', new AbortController().signal),
  ).resolves.toBe(true);
});

it('stops preparation immediately when the current session cancels it', async () => {
  tasks.events.mockReturnValue(new Promise(() => {}));
  const controller = new AbortController();
  const result = prepareOfflineAccess('account', controller.signal);
  const rejection = expect(result).rejects.toThrow();
  controller.abort();
  await rejection;
  expect(tasks.events.mock.calls[0][1].aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});
