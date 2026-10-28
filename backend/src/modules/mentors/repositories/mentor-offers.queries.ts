import type { Prisma } from '../../../prisma/client.js';
import { readMentorCapacity } from './mentor-capacity.queries.js';

// Invocar dentro del bloqueo compartido con las altas directas de HU-7-1.
export async function reconcileMentorOffers(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`
    WITH expired AS (
      UPDATE mentor_slot_offers SET status = 'EXPIRED'
      WHERE status = 'OFFERED' AND expires_at <= clock_timestamp()
      RETURNING request_id
    )
    UPDATE mentor_participation_requests SET status = 'EXPIRED'
    WHERE status = 'OFFERED' AND id IN (SELECT request_id FROM expired)
  `;
  const { available } = await readMentorCapacity(tx);
  if (!available) return;
  await tx.$executeRaw`
    WITH instant AS MATERIALIZED (SELECT clock_timestamp() AS now), next_requests AS (
      SELECT r.id, r.user_id FROM mentor_participation_requests r
      JOIN users u ON u.id = r.user_id
      WHERE r.status = 'PENDING' AND u.is_active = true
        AND EXISTS (SELECT 1 FROM access_requests ar JOIN access_request_statuses s ON s.id = ar.status_id
          WHERE ar.approved_user_id = u.id AND s.title = 'approved')
        AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles role ON role.id = ur.role_id
          WHERE ur.user_id = u.id AND role.name = 'titulado' AND ur.deleted_at IS NULL
            AND ur.start_at <= (SELECT now FROM instant))
        AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles role ON role.id = ur.role_id
          WHERE ur.user_id = u.id AND role.name = 'mentor' AND ur.deleted_at IS NULL
            AND ur.start_at <= (SELECT now FROM instant))
        AND NOT EXISTS (SELECT 1 FROM mentor_slot_offers o
          WHERE o.request_id = r.id OR (o.user_id = u.id AND o.status = 'OFFERED'))
        AND cardinality(r.technical_area_ids) > 0 AND cardinality(r.orientation_type_ids) > 0
        AND (SELECT count(*) FROM technical_areas a WHERE a.id = ANY(r.technical_area_ids)) = cardinality(r.technical_area_ids)
        AND (SELECT count(*) FROM orientation_types o WHERE o.id = ANY(r.orientation_type_ids)
          AND o.is_active = true) = cardinality(r.orientation_type_ids)
      ORDER BY r.queued_at ASC, r.id ASC LIMIT ${available} FOR UPDATE OF r
    ), offered AS (
      INSERT INTO mentor_slot_offers (id, user_id, request_id, offered_at, expires_at)
      SELECT gen_random_uuid(), r.user_id, r.id, instant.now, instant.now + interval '24 hours'
      FROM next_requests r CROSS JOIN instant RETURNING request_id
    )
    UPDATE mentor_participation_requests SET status = 'OFFERED'
    WHERE id IN (SELECT request_id FROM offered)
  `;
}
