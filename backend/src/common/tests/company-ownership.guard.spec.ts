import { describe, expect, it } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import { CompanyOwnershipGuard } from '../guards/company-ownership.guard.js';
import { ForbiddenRoleException } from '../exceptions/forbidden-role.exception.js';

const context = (
  companyId?: string,
  company?: { id: string; name: string } | null,
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        params: { companyId },
        user: { id: 'user-1', company },
      }),
    }),
  }) as unknown as ExecutionContext;

describe('CompanyOwnershipGuard', () => {
  const guard = new CompanyOwnershipGuard();
  it('allows only the company loaded from the authenticated database session', () => {
    expect(
      guard.canActivate(
        context('company-1', { id: 'company-1', name: 'Empresa' }),
      ),
    ).toBe(true);
  });
  it('rejects another company even when a company user is authenticated', () => {
    expect(() =>
      guard.canActivate(
        context('company-2', { id: 'company-1', name: 'Empresa' }),
      ),
    ).toThrow(ForbiddenRoleException);
  });
  it.each([null, undefined])(
    'rejects sessions without a company relationship',
    (company) => {
      expect(() => guard.canActivate(context('company-1', company))).toThrow(
        ForbiddenRoleException,
      );
    },
  );
  it('rejects a missing company route parameter', () => {
    expect(() =>
      guard.canActivate(
        context(undefined, { id: 'company-1', name: 'Empresa' }),
      ),
    ).toThrow(ForbiddenRoleException);
  });
});
