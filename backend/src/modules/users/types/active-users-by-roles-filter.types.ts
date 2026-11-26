import type { RoleName } from '../../../common/enums/roles.enum.js';

export interface ActiveUsersByRolesFilter {
  roles: readonly RoleName[];
  userIds?: readonly string[];
}
