import { SetMetadata } from '@nestjs/common';
import { RoleName } from '../enums/roles.enum.js';

export const ROLES_KEY = 'roles';

/** Solo guarda metadata; quien la lee y decide es RolesGuard. */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);

/** Forma de request.user. Es el contrato que usan los endpoints. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
}
