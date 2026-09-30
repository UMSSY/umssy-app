import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('connects and disconnects with the module lifecycle', async () => {
    vi.stubEnv('DB_SCHEMA', 'test');
    const service = new PrismaService();
    const connect = vi.spyOn(service, '$connect').mockResolvedValue();
    const disconnect = vi.spyOn(service, '$disconnect').mockResolvedValue();

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(connect).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('can be created without a custom schema', () => {
    vi.stubEnv('DB_SCHEMA', '');

    const service = new PrismaService();

    expect(typeof service.onModuleInit).toBe('function');
  });
});
