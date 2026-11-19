import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { withMentorCapacityLock } from './mentor-capacity-lock.js';
import { readMentorCapacity } from './mentor-capacity.queries.js';
import { reconcileMentorOffers } from './mentor-offers.queries.js';

const pageResult = <T>(items: T[], totalItems: number, page: number, limit: number) => ({
  items,
  totalItems,
  page,
  limit,
  totalPages: Math.ceil(totalItems / limit),
});

@Injectable()
export class MentorCapacityAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async overview(tx: Prisma.TransactionClient) {
    const [capacity, pending] = await Promise.all([
      readMentorCapacity(tx),
      tx.$queryRaw<{ count: number }[]>`
        SELECT count(*)::int AS count
        FROM mentor_participation_requests
        WHERE status = 'PENDING'
      `,
    ]);
    return { ...capacity, pendingRequests: pending[0].count };
  }

  getOverview() {
    return this.prisma.$transaction((tx) => this.overview(tx));
  }

  updatePercentage(percentage: number) {
    return withMentorCapacityLock(this.prisma, async (tx) => {
      await tx.$executeRaw`
        UPDATE mentor_capacity_settings
        SET percentage = ${percentage}, updated_at = clock_timestamp()
        WHERE id = 1
      `;
      await reconcileMentorOffers(tx);
      return this.overview(tx);
    });
  }

  async listWaitingRequests(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [items, totals] = await Promise.all([
      this.prisma.$queryRaw<
        {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          queuedAt: Date;
        }[]
      >`
        SELECT r.id, u.first_name AS "firstName", u.last_name AS "lastName",
          u.email, r.queued_at AS "queuedAt"
        FROM mentor_participation_requests r
        JOIN users u ON u.id = r.user_id
        WHERE r.status = 'PENDING'
        ORDER BY r.queued_at ASC, r.id ASC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<{ count: number }[]>`
        SELECT count(*)::int AS count
        FROM mentor_participation_requests
        WHERE status = 'PENDING'
      `,
    ]);
    return pageResult(items, totals[0].count, page, limit);
  }

  async listOfferHistory(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [items, totals] = await Promise.all([
      this.prisma.$queryRaw<
        {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          status: string;
          offeredAt: Date;
          expiresAt: Date;
          confirmedAt: Date | null;
        }[]
      >`
        SELECT o.id, u.first_name AS "firstName", u.last_name AS "lastName",
          u.email, o.status, o.offered_at AS "offeredAt",
          o.expires_at AS "expiresAt", o.confirmed_at AS "confirmedAt"
        FROM mentor_slot_offers o
        JOIN users u ON u.id = o.user_id
        ORDER BY o.offered_at DESC, o.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<{ count: number }[]>`
        SELECT count(*)::int AS count FROM mentor_slot_offers
      `,
    ]);
    return pageResult(items, totals[0].count, page, limit);
  }
}
