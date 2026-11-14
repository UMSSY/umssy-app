import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { Prisma } from '../../../prisma/client.js';
import type {
  VerificationJob,
  VerificationResult,
} from '../types/document-verification.type.js';

const fields = Prisma.sql`d.id, d.source_type AS "sourceType", d.source_id AS "sourceId", d.filename,
  d.mime, d.size_bytes AS "sizeBytes", d.status, d.reason, d.confidence, d.skills, d.active,
  d.content IS NOT NULL AS available, d.created_at AS "createdAt", d.decided_at AS "decidedAt", d.synced, d.notice_read AS "noticeRead", d.radar_version AS "radarVersion", d.published_ids AS "publishedIds"`;

@Injectable()
export class DocumentVerificationRepository {
  constructor(private readonly db: PrismaService) {}

  history(owner: string) {
    return this.db
      .$queryRaw(Prisma.sql`SELECT ${fields} FROM radar_document_verifications d
      WHERE d.user_id=${owner}::uuid ORDER BY d.created_at DESC, d.id DESC`);
  }
  acknowledge(owner: string, id: string, status: string) {
    return this.db
      .$executeRaw`UPDATE radar_document_verifications SET notice_read=true WHERE id=${id}::uuid
      AND user_id=${owner}::uuid AND status=${status} AND decided_at IS NOT NULL`;
  }
  reviews(filter: string) {
    const groups: Record<string, string[]> = {
      pending: ['review', 'low_confidence'],
      approved: ['approved', 'manual_approved'],
      rejected: ['low_confidence', 'manual_rejected'],
    };
    const statuses = groups[filter];
    const condition = statuses
      ? Prisma.sql`AND d.status IN (${Prisma.join(statuses)})`
      : Prisma.empty;
    return this.db
      .$queryRaw(Prisma.sql`SELECT ${fields},concat_ws(' ',u.first_name,u.last_name) AS "ownerName"
      FROM radar_document_verifications d JOIN users u ON u.id=d.user_id
      WHERE d.active ${condition} ORDER BY d.created_at DESC`);
  }
  file(id: string, owner?: string) {
    const scope = owner ? Prisma.sql`AND user_id=${owner}::uuid` : Prisma.empty;
    return this.db.$queryRaw<
      { mime: string; content: Uint8Array }[]
    >(Prisma.sql`SELECT mime,content FROM radar_document_verifications
      WHERE id=${id}::uuid AND content IS NOT NULL ${scope}`);
  }
  async claim() {
    const jobs = await this.db.$queryRaw<VerificationJob[]>`
      WITH candidate AS (SELECT id FROM radar_document_verifications WHERE active AND NOT synced AND retry_at <= now()
        ORDER BY retry_at,created_at LIMIT 1 FOR UPDATE SKIP LOCKED),
      job AS (UPDATE radar_document_verifications d SET lease=gen_random_uuid(),retry_at=now()+interval '10 minutes',
        status=CASE WHEN status='queued' THEN 'reading' ELSE status END FROM candidate WHERE d.id=candidate.id RETURNING d.*)
      SELECT j.id,j.user_id AS "userId",j.source_type AS "sourceType",j.source_id AS "sourceId",j.mime,j.filename,j.status,j.lease,
        CASE WHEN j.status='reading' THEN j.content END AS content,u.first_name AS "firstName",u.last_name AS "lastName",c.issuing_organization AS issuer,
        EXISTS(SELECT 1 FROM radar_document_verifications v WHERE v.user_id=j.user_id AND v.digest=j.digest
          AND (v.created_at,v.id)<(j.created_at,j.id)) AS duplicate
      FROM job j JOIN users u ON u.id=j.user_id LEFT JOIN certifications c ON j.source_type='certification' AND c.id=j.source_id`;
    return jobs[0];
  }
  async finish(job: VerificationJob, result: VerificationResult) {
    return this.db
      .$executeRaw`UPDATE radar_document_verifications SET status=${result.status}, reason=${result.reason},
      confidence=${result.confidence},skills=${JSON.stringify(result.skills)}::jsonb,decided_at=clock_timestamp()
      WHERE id=${job.id}::uuid AND lease=${job.lease}::uuid AND active AND status='reading'`;
  }
  markSynced(job: VerificationJob, version: number | null, ids: string[]) {
    return this.db
      .$executeRaw`UPDATE radar_document_verifications SET synced=true,lease=NULL,radar_version=${version},published_ids=${JSON.stringify(ids)}::jsonb
      WHERE id=${job.id}::uuid AND lease=${job.lease}::uuid AND active`;
  }
  revise(admin: string, id: string, action: 'reprocess' | 'revoke') {
    if (action === 'revoke')
      return this.db.$executeRaw`UPDATE radar_document_verifications SET
      reviewer_id=${admin}::uuid,status='manual_rejected',reason='Aprobación revocada por administración.',
      decided_at=clock_timestamp(),synced=false,lease=NULL,retry_at=now(),notice_read=false
      WHERE id=${id}::uuid AND active AND status IN ('approved','manual_approved')`;
    return this.db.$transaction(async (tx) => {
      const count =
        await tx.$executeRaw`UPDATE radar_document_verifications SET status='queued',synced=false,
        confidence=NULL,reason='',skills='[]',published_ids='[]',radar_version=NULL,lease=NULL,retry_at=now(),decided_at=NULL,reviewer_id=NULL
        WHERE id=${id}::uuid AND active AND content IS NOT NULL AND status IN ('review','low_confidence','legacy')`;
      if (count)
        await tx.$executeRaw`INSERT INTO radar_audit_events(user_id,actor_id,event_type,target_id,details)
        SELECT user_id,${admin}::uuid,'document.reprocess',id,'{}'::jsonb FROM radar_document_verifications WHERE id=${id}::uuid`;
      return count;
    });
  }
  decide(admin: string, id: string, approve: boolean) {
    return this.db
      .$executeRaw`UPDATE radar_document_verifications SET reviewer_id=${admin}::uuid,
      status=${approve ? 'manual_approved' : 'manual_rejected'},reason=${approve ? 'Aprobación administrativa.' : 'Rechazo administrativo.'},
      synced=false,notice_read=false,lease=NULL,retry_at=now(),decided_at=clock_timestamp()
      WHERE id=${id}::uuid AND active AND status IN ('review','low_confidence')`;
  }
}
