import '@/shared/testing/indexed-db.mock';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { apiClient } from './api-client';

vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(toast.info).mockClear();
});

describe('apiClient without connection', () => {
  it('rejects offline mutations before sending them and tells the user', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const adapter = vi.fn();
    await expect(apiClient.post('/events/test', {}, { adapter })).rejects.toThrow('Necesitas conexión');
    expect(adapter).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('Necesitas conexión para realizar esta acción.');
  });

  it('fails offline reads quietly without sending them', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const adapter = vi.fn();
    await expect(apiClient.get('/events', { adapter })).rejects.toMatchObject({ code: 'ERR_NETWORK' });
    expect(adapter).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });
});
