import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorTransactionRepository } from './mentor-transaction.repository.js';
import type { MentorParticipationRequest } from '../types/mentor-participation-request.types.js';
import type { MentorTransaction } from '../types/mentor-transaction.types.js';

const fields = Prisma.sql`id, user_id AS "userId", mentor_request_status_title(status_id) AS status, queued_at AS "queuedAt",
  created_at AS "createdAt", technical_area_ids AS "technicalAreaIds",
  orientation_type_ids AS "orientationTypeIds"`;

@Injectable()
export class MentorParticipationRepository extends MentorTransactionRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async openRequest(tx: MentorTransaction, userId: string) {
    const [request] = await tx.$queryRaw<MentorParticipationRequest[]>`
      SELECT ${fields} FROM mentor_participation_requests
      WHERE user_id = ${userId}::uuid AND status_id IN (mentor_request_status('PENDING'), mentor_request_status('OFFERED'))
      ORDER BY queued_at, id LIMIT 1 FOR UPDATE`;
    return request;
  }

  async hasOffer(tx: MentorTransaction, userId: string) {
    const [offer] = await tx.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM mentor_slot_offers WHERE user_id = ${userId}::uuid
        AND status_id = mentor_offer_status('OFFERED') AND expires_at > clock_timestamp()) AS exists`;
    return offer.exists;
  }

  async createRequest(
    tx: MentorTransaction,
    userId: string,
    technicalAreaIds: string[],
    orientationTypeIds: string[],
  ) {
    const [request] = await tx.$queryRaw<MentorParticipationRequest[]>`
      WITH instant AS MATERIALIZED (SELECT clock_timestamp() AS now)
      INSERT INTO mentor_participation_requests
        (id, user_id, status_id, queued_at, created_at, technical_area_ids, orientation_type_ids)
      SELECT gen_random_uuid(), ${userId}::uuid, mentor_request_status('PENDING'), instant.now, instant.now,
        ARRAY[${Prisma.join(technicalAreaIds)}]::uuid[], ARRAY[${Prisma.join(orientationTypeIds)}]::uuid[]
      FROM instant RETURNING ${fields}`;
    return request;
  }

  findMyRequest(userId: string, tx: MentorTransaction) {
    return tx.mentorParticipationRequest.findFirst({
      where: { userId },
      orderBy: [{ queuedAt: 'desc' }, { id: 'desc' }],
      include: {
        status: true,
        offer: { include: { status: true } },
        user: { select: { email: true } },
      },
    });
  }

  findMyHistory(userId: string) {
    return this.withUtcRead((tx) => tx.$queryRaw<MentorParticipationRequest[]>`
      SELECT ${fields} FROM mentor_participation_requests WHERE user_id = ${userId}::uuid
      ORDER BY queued_at DESC, id DESC`);
  }

  async pendingRequest(tx: MentorTransaction, userId: string) {
    const [request] = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM mentor_participation_requests WHERE user_id = ${userId}::uuid AND status_id = mentor_request_status('PENDING') FOR UPDATE`;
    return request;
  }

  async updatePreferences(
    tx: MentorTransaction,
    id: string,
    technicalAreaIds: string[],
    orientationTypeIds: string[],
  ) {
    const [request] = await tx.$queryRaw<MentorParticipationRequest[]>`
      UPDATE mentor_participation_requests
      SET technical_area_ids = ARRAY[${Prisma.join(technicalAreaIds)}]::uuid[],
        orientation_type_ids = ARRAY[${Prisma.join(orientationTypeIds)}]::uuid[]
      WHERE id = ${id}::uuid RETURNING ${fields}`;
    return request;
  }

  async cancelRequest(tx: MentorTransaction, userId: string) {
    const [request] = await tx.$queryRaw<MentorParticipationRequest[]>`
      UPDATE mentor_participation_requests SET status_id = mentor_request_status('CANCELLED')
      WHERE user_id = ${userId}::uuid AND status_id = mentor_request_status('PENDING') RETURNING ${fields}`;
    return request;
  }
}
