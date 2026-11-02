import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  catalogs: vi.fn(),
  admin: vi.fn(),
}));
vi.mock('../database/seed-client.js', () => ({
  createSeedClient: mocks.createClient,
}));
vi.mock('../database/required-catalogs.js', () => ({
  seedRequiredCatalogs: mocks.catalogs,
}));
vi.mock('../../modules/users/seeds/production-admin.seed.js', () => ({
  seedProductionAdmin: mocks.admin,
}));

import {
  runCatalogSeed,
  runCatalogSeedCli,
} from '../database/catalog-seeds.js';

import type { PrismaClient } from '../../prisma/client.js';
import {
  runProductionSeed,
  runProductionSeedCli,
} from '../database/production-seeds.js';

describe('Inicialización de producción', () => {
  const tx = { $executeRaw: vi.fn() };
  const client = { $transaction: vi.fn(), $disconnect: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createClient.mockReturnValue(client);
    mocks.admin.mockResolvedValue({
      email: 'admin@example.org',
      password: 'generated-secret',
      isCreated: true,
    });
    client.$transaction.mockImplementation(async (operation) => operation(tx));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it('valida los argumentos antes de abrir la conexión', async () => {
    await runProductionSeedCli([]);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('--email'),
    );
  });

  it('rechaza correos inválidos sin escribir', async () => {
    await expect(runProductionSeed('invalid')).rejects.toThrow();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('ejecuta catálogos y cuenta dentro de la misma transacción y libera la conexión', async () => {
    await runProductionSeed('Admin@Example.org');
    expect(client.$transaction).toHaveBeenCalledOnce();
    expect(tx.$executeRaw).toHaveBeenCalledOnce();
    expect(mocks.catalogs).toHaveBeenCalledWith(tx);
    expect(mocks.admin).toHaveBeenCalledWith(tx, 'admin@example.org');
    expect(client.$disconnect).toHaveBeenCalledOnce();
  });

  it('no cierra un cliente proporcionado por el consumidor', async () => {
    await runProductionSeed(
      'admin@example.org',
      client as unknown as PrismaClient,
    );
    expect(client.$disconnect).not.toHaveBeenCalled();
  });

  it('no imprime credenciales antes de confirmar la transacción', async () => {
    client.$transaction.mockImplementation(async (operation) => {
      const result = await operation(tx);
      expect(console.log).not.toHaveBeenCalled();
      return result;
    });
    await runProductionSeedCli(['--email', 'admin@example.org']);
    expect(console.log).toHaveBeenCalledWith('Contraseña: generated-secret');
  });

  it('no imprime contraseñas al repetir la inicialización', async () => {
    mocks.admin.mockResolvedValue({
      email: 'admin@example.org',
      password: null,
      isCreated: false,
    });
    await runProductionSeedCli(['--email', 'admin@example.org']);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('su contraseña se conserva'),
    );
    expect(console.log).not.toHaveBeenCalledWith(
      expect.stringContaining('Contraseña:'),
    );
  });

  it('propaga fallos transaccionales sin imprimir la contraseña y cierra el cliente', async () => {
    client.$transaction.mockRejectedValue(
      new Error('No se confirmó la transacción'),
    );
    await runProductionSeedCli(['--email', 'admin@example.org']);
    expect(console.log).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'No se pudo inicializar producción:',
      'No se confirmó la transacción',
    );
    expect(process.exitCode).toBe(1);
    expect(client.$disconnect).toHaveBeenCalledOnce();
  });
  it('carga solo catálogos sin crear cuentas', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      await runCatalogSeed();
      expect(mocks.catalogs).toHaveBeenCalledWith(tx);
      expect(mocks.admin).not.toHaveBeenCalled();
      expect(tx.$executeRaw).toHaveBeenCalledOnce();
      expect(client.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        maxWait: 5000,
        timeout: 120000,
      });
      expect(client.$disconnect).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('no cierra el cliente externo al cargar catálogos', async () => {
    await runCatalogSeed(client as unknown as PrismaClient);
    expect(client.$disconnect).not.toHaveBeenCalled();
  });

  it('rechaza argumentos de administrador en el comando de catálogos', async () => {
    await runCatalogSeedCli(['--email', 'admin@example.org']);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('cierra la conexión y comunica fallos al cargar catálogos', async () => {
    client.$transaction.mockRejectedValue(new Error('Catálogo inválido'));
    await runCatalogSeedCli([]);
    expect(client.$disconnect).toHaveBeenCalledOnce();
    expect(console.log).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'No se pudieron cargar los catálogos:',
      'Catálogo inválido',
    );
    expect(process.exitCode).toBe(1);
  });
});
