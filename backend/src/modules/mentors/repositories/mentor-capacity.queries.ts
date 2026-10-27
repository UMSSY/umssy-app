import type { Prisma } from '../../../prisma/client.js';
import type { MentorCapacityCounts } from '../types/mentor-capacity.types.js';

export async function readMentorCapacityCounts(tx: Prisma.TransactionClient) {
  const [counts] = await tx.$queryRaw<MentorCapacityCounts[]>`
    WITH instant AS (SELECT clock_timestamp() AS now)
    SELECT
      (SELECT count(*)::int FROM users u WHERE u.is_active = true
        AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id AND r.name = 'titulado' AND ur.deleted_at IS NULL
            AND ur.start_at <= (SELECT now FROM instant))
        AND EXISTS (SELECT 1 FROM access_requests ar
          JOIN access_request_statuses s ON s.id = ar.status_id
          WHERE ar.approved_user_id = u.id AND s.title = 'approved')) AS "approvedGraduates",
      (SELECT count(*)::int FROM users u WHERE u.is_active = true
        AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id AND r.name = 'mentor' AND ur.deleted_at IS NULL
            AND ur.start_at <= (SELECT now FROM instant))) AS "activeMentors",
      (SELECT count(*)::int FROM mentor_slot_offers
        WHERE status_id = mentor_offer_status('OFFERED') AND expires_at > (SELECT now FROM instant)) AS "reservedOffers"
  `;
  return counts;
}
