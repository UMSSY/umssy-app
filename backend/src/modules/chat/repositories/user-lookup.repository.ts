import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

export type SearchUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  headline: string | null;
  photo_url: Uint8Array | null;
  is_online: boolean | null;
  role_name: string | null;
};

@Injectable()
export class UserLookupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveById(userId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        isActive: true,
      },
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
      where: {
        id: userId,
      },
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

    
    return this.prisma.$queryRaw<SearchUserRow[]>`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.headline,
        u.photo_url,
        up.is_online,
        (
          SELECT CASE lower(trim(r.name))
            WHEN 'estudiante' THEN 'STUDENT'
            WHEN 'titulado' THEN 'GRADUATE'
            WHEN 'empresa' THEN 'RECRUITER'
            WHEN 'mentor' THEN 'MENTOR'
          END
          FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id
            AND ur.deleted_at IS NULL
          ORDER BY ur.created_at ASC, r.name ASC
          LIMIT 1
        ) AS role_name
      FROM users u
      LEFT JOIN user_presences up ON up.user_id = u.id
      WHERE u.id <> ${excludeUserId}::uuid
        AND u.is_active = true
        AND lower(
          u.first_name || ' ' || u.last_name || ' ' || u.email
        ) LIKE lower(${pattern}) ESCAPE '\\'
      ORDER BY u.first_name ASC, u.last_name ASC, u.id ASC
      LIMIT ${limit};
    `;
  }
}