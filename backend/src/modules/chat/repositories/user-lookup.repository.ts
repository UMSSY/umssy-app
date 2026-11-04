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
  can_chat_by_application: boolean;
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
      WITH eligible_users AS (
        SELECT
          u.*,
          EXISTS (
            SELECT 1
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id
              AND ur.deleted_at IS NULL
              AND lower(trim(r.name)) IN ('estudiante', 'titulado')
          )
          AND NOT EXISTS (
            SELECT 1
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id
              AND ur.deleted_at IS NULL
              AND lower(trim(r.name)) NOT IN ('estudiante', 'titulado')
          ) AS is_student,
          EXISTS (
            SELECT 1
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id
              AND ur.deleted_at IS NULL
              AND lower(trim(r.name)) = 'empresa'
          )
          AND NOT EXISTS (
            SELECT 1
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id
              AND ur.deleted_at IS NULL
              AND lower(trim(r.name)) <> 'empresa'
          ) AS is_company
        FROM users u
        WHERE u.is_active = true
      ),
      contacts AS (
        SELECT
          u.*,
          up.is_online,
          (
            (
              me.is_student
              AND u.is_company
              AND EXISTS (
                SELECT 1
                FROM job_applications ja
                JOIN job_offers jo ON jo.id = ja.job_offer_id
                WHERE ja.user_id = me.id
                  AND jo.company_id = u.company_id
              )
            )
            OR
            (
              me.is_company
              AND u.is_student
              AND EXISTS (
                SELECT 1
                FROM job_applications ja
                JOIN job_offers jo ON jo.id = ja.job_offer_id
                WHERE ja.user_id = u.id
                  AND jo.company_id = me.company_id
              )
            )
          ) AS can_chat_by_application,
          (
            me.is_student AND u.is_student
          ) AS can_chat_as_student
        FROM eligible_users u
        JOIN eligible_users me
          ON me.id = ${excludeUserId}::uuid
        LEFT JOIN user_presences up
          ON up.user_id = u.id
        WHERE u.id <> me.id
          AND lower(
            u.first_name || ' ' || u.last_name || ' ' || u.email
          ) LIKE lower(${pattern}) ESCAPE '\\'
      )
      SELECT
        id,
        first_name,
        last_name,
        headline,
        photo_url,
        is_online,
        (
          SELECT CASE lower(trim(r.name))
            WHEN 'estudiante' THEN 'STUDENT'
            WHEN 'titulado' THEN 'GRADUATE'
            WHEN 'empresa' THEN 'RECRUITER'
          END
          FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = contacts.id
            AND ur.deleted_at IS NULL
          ORDER BY ur.created_at ASC, r.name ASC
          LIMIT 1
        ) AS role_name,
        can_chat_by_application
      FROM contacts
      WHERE can_chat_as_student
         OR can_chat_by_application
      ORDER BY first_name ASC, last_name ASC, id ASC
      LIMIT ${limit};
    `;
  }
}