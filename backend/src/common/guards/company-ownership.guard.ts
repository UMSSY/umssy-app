import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ForbiddenRoleException } from '../exceptions/forbidden-role.exception.js';
import type { AuthenticatedUser } from '../types/authenticated-user.types.js';

@Injectable()
export class CompanyOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params: { companyId?: string };
    }>();
    const companyId = request.params.companyId;
    if (
      !companyId ||
      !request.user?.company ||
      request.user.company.id.toLowerCase() !== companyId.toLowerCase()
    ) {
      throw new ForbiddenRoleException('No tienes acceso a esta empresa');
    }
    return true;
  }
}
