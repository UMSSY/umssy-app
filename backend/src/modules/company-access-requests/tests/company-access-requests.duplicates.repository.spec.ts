import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyAccessRequestsRepository } from '../repositories/company-access-requests.repository.js';

type QueryCall = { sql: string; values: unknown[] };

describe('CompanyAccessRequestsRepository.findDuplicates', () => {
  const calls: QueryCall[] = [];
  const prisma = {
    $queryRaw: vi.fn(),
    user: { findUnique: vi.fn() },
  };
  let results: unknown[][];
  let repository: CompanyAccessRequestsRepository;

  beforeEach(() => {
    calls.length = 0;
    results = [[], [], []];
    prisma.user.findUnique.mockReset().mockResolvedValue(null);
    prisma.$queryRaw.mockReset().mockImplementation((strings: TemplateStringsArray, ...values: unknown[]) => {
      calls.push({ sql: strings.join('?'), values });
      return Promise.resolve(results[calls.length - 1] ?? []);
    });
    repository = new CompanyAccessRequestsRepository(prisma as never);
  });

  it('devuelve todo vacío cuando nada coincide', async () => {
    await expect(repository.findDuplicates('Acme Corp', 'acme@test.com', 'acme_user')).resolves.toEqual({
      existingCompany: null,
      existingUser: null,
      activeRequest: null,
      existingUsername: null,
    });
  });

  it('compara los nombres ya normalizados (minúsculas y espacios colapsados)', async () => {
    await repository.findDuplicates('  ACME   Corp ', 'acme@test.com', ' Acme_USER ');

    const companyQuery = calls.find((call) => call.sql.includes('FROM companies'));
    const requestQuery = calls.find((call) => call.sql.includes('r.company_name'));
    const usernameQuery = calls.find((call) => call.sql.includes('u.first_name'));
    expect(companyQuery?.values).toContain('acme corp');
    expect(requestQuery?.values).toContain('acme corp');
    expect(usernameQuery?.values).toContain('acme_user');
    expect(usernameQuery?.values.filter((value) => value === 'acme_user')).toHaveLength(2);
  });

  it('solo bloquean las solicitudes pendientes, en revisión, observadas y aprobadas', async () => {
    await repository.findDuplicates('Acme Corp', 'acme@test.com', 'acme_user');

    const statusLists = calls
      .flatMap((call) => call.values)
      .filter((value): value is string[] => Array.isArray(value));
    expect(statusLists.length).toBeGreaterThanOrEqual(2);
    for (const list of statusLists) {
      expect(list).toEqual(['PENDING', 'IN_REVIEW', 'OBSERVED', 'APPROVED']);
      expect(list).not.toContain('REJECTED');
      expect(list).not.toContain('DRAFT');
      expect(list).not.toContain('CANCELLED');
    }
  });

  it('compara el usuario solo contra cuentas con rol empresa que no estén dadas de baja', async () => {
    await repository.findDuplicates('Acme Corp', 'acme@test.com', 'acme_user');

    const usernameQuery = calls.find((call) => call.sql.includes('u.first_name'));
    expect(usernameQuery?.sql).toContain('ur.deleted_at IS NULL');
    expect(usernameQuery?.values).toContain('empresa');
  });

  it('no usa las solicitudes en borrador ni rechazadas para detectar el nombre', async () => {
    await repository.findDuplicates('Acme Corp', 'acme@test.com', 'acme_user');

    for (const call of calls.filter((entry) => entry.sql.includes('company_access_requests'))) {
      expect(call.sql).toContain('s.title = ANY(');
      expect(call.sql).not.toMatch(/DRAFT|REJECTED/);
    }
  });

  it('informa la empresa, la solicitud y el usuario que coinciden', async () => {
    results = [
      [{ id: 'company-1' }],
      [{ companyName: 'Acme Corp', email: 'otro@test.com' }],
      [{ source: 'user' }],
    ];
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

    await expect(repository.findDuplicates('Acme Corp', 'acme@test.com', 'acme_user')).resolves.toEqual({
      existingCompany: { id: 'company-1' },
      existingUser: { id: 'user-1' },
      activeRequest: { companyName: 'Acme Corp', email: 'otro@test.com' },
      existingUsername: { source: 'user' },
    });
  });
});
