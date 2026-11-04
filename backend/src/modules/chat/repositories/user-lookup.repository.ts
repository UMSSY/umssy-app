
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { hasOnlyChatAllowedRoles } from '../constants/chat-role-policy.constants.js';

type SearchUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  photo_url: Uint8Array | null;
  is_online: boolean | null;
  role_name: string | null;
};

type SearchUserWithRolesRow = SearchUserRow & {
  role_names: string[];
};

@Injectable()
export class UserLookupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveById(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        headline: true,
      },
    });
  }

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
  }

  async searchActiveByName(
    normalizedQuery: string,
    excludeUserId: string,
    limit: number,
  ): Promise<SearchUserRow[]> {
    if (limit <= 0) return [];

    const escaped = normalizedQuery.replace(/[%_\\]/g, '\\$&');
    const pattern = `%${escaped}%`;

    const rows = await this.prisma.$queryRaw<SearchUserWithRolesRow[]>`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.headline,
        u.photo_url,
        up.is_online,
        (
          SELECT r.name
          FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id
            AND ur.deleted_at IS NULL
          ORDER BY ur.created_at ASC, r.name ASC
          LIMIT 1
        ) AS role_name,
        ARRAY(
          SELECT r.name
          FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id
            AND ur.deleted_at IS NULL
        ) AS role_names
      FROM users u
      LEFT JOIN user_presences up ON up.user_id = u.id
      WHERE u.id <> ${excludeUserId}::uuid
        AND u.is_active = true
        AND lower(u.first_name || ' ' || u.last_name)
            LIKE lower(${pattern}) ESCAPE '\'
      ORDER BY u.first_name ASC, u.last_name ASC, u.id ASC;
    `;

    return rows
      .filter((row) => hasOnlyChatAllowedRoles(row.role_names))
      .slice(0, limit)
      .map(({ role_names, ...row }) => {
        void role_names;
        return row;
      });
  }
}
