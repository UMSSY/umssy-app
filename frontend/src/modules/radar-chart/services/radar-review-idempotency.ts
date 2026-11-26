import {
  getAccessToken,
  initializeAccessTokenStorage,
} from '@/shared/services/storage/access-token-storage';
import {
  readIndexedDbByPrefix,
  updateIndexedDb,
} from '@/shared/services/storage/browser-indexed-db';
import {
  getCookieSessionSubject,
  hasCookieSession,
} from '@/shared/services/storage/cookie-session-state';
import { readCurrentSessionUserId } from '@/shared/services/storage/session-user-id-storage';

import type { RadarReviewKind as ReviewKind } from '../types/radar-review-kind.types';
import type { RadarReviewDecision as ReviewDecision } from '../types/radar-review-decision.types';
import type { PendingReviewOperation } from '../types/pending-review-operation.types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function currentSubject(): Promise<string> {
  try {
    const payload = getAccessToken()?.split('.')[1];
    if (payload) {
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded: unknown = JSON.parse(atob(normalized));

      if (
        typeof decoded === 'object' &&
        decoded !== null &&
        'sub' in decoded &&
        typeof decoded.sub === 'string' &&
        decoded.sub
      ) {
        return decoded.sub;
      }
    }

    if (hasCookieSession()) {
      const sessionSubject =
        getCookieSessionSubject() ?? (await readCurrentSessionUserId());
      if (sessionSubject) return sessionSubject;
    }

    throw new Error('Sesión no disponible');
  } catch {
    throw new Error('No se pudo identificar al administrador de la sesión');
  }
}

function operationKey(
  subject: string,
  kind: ReviewKind,
  targetId: string,
  decision: ReviewDecision,
): string {
  return `hu4:radar-review:${subject}:${kind}:${targetId}:${decision}`;
}

function fingerprint(
  kind: ReviewKind,
  targetId: string,
  decision: ReviewDecision,
): string {
  return JSON.stringify({ kind, targetId, decision });
}

export async function getRadarReviewOperationId(
  kind: ReviewKind,
  targetId: string,
  decision: ReviewDecision,
): Promise<string> {
  await initializeAccessTokenStorage();

  const subject = await currentSubject();
  const key = operationKey(subject, kind, targetId, decision);
  const intent = fingerprint(kind, targetId, decision);

  const saved = await updateIndexedDb<PendingReviewOperation>(
    key,
    (current) => {
      if (
        current?.fingerprint === intent &&
        UUID_PATTERN.test(current.operationId)
      ) {
        return current;
      }

      if (typeof crypto.randomUUID !== 'function') {
        throw new Error('El navegador no permite generar identificadores UUID');
      }

      return {
        fingerprint: intent,
        operationId: crypto.randomUUID(),
      };
    },
  );

  if (!saved || !UUID_PATTERN.test(saved.operationId)) {
    throw new Error('No se pudo guardar la operación pendiente');
  }

  return saved.operationId;
}

export async function clearRadarReviewOperationId(
  kind: ReviewKind,
  targetId: string,
  decision: ReviewDecision,
  operationId: string,
): Promise<void> {
  await initializeAccessTokenStorage();

  const subject = await currentSubject();
  const key = operationKey(subject, kind, targetId, decision);

  await updateIndexedDb<PendingReviewOperation>(key, (current) =>
    current?.operationId === operationId ? null : current,
  );
}

export async function listRadarReviewOperations(): Promise<
  Array<{
    kind: ReviewKind;
    targetId: string;
    decision: ReviewDecision;
    operationId: string;
  }>
> {
  await initializeAccessTokenStorage();

  const subject = await currentSubject();
  const prefix = 'hu4:radar-review:' + subject + ':';
  const entries = await readIndexedDbByPrefix<PendingReviewOperation>(prefix);

  const operations: Array<{
    kind: ReviewKind;
    targetId: string;
    decision: ReviewDecision;
    operationId: string;
  }> = [];

  for (const entry of entries) {
    const parts = entry.key.slice(prefix.length).split(':');
    if (parts.length !== 3) continue;

    const [kindValue, targetId, decisionValue] = parts;

    if (
      (kindValue !== 'cv' && kindValue !== 'skill') ||
      !UUID_PATTERN.test(targetId) ||
      (decisionValue !== 'approved' &&
        decisionValue !== 'rejected' &&
        decisionValue !== 'revoked')
    ) {
      continue;
    }

    const kind = kindValue as ReviewKind;
    const decision = decisionValue as ReviewDecision;
    const saved = entry.value;

    if (
      !saved ||
      saved.fingerprint !== fingerprint(kind, targetId, decision) ||
      !UUID_PATTERN.test(saved.operationId)
    ) {
      continue;
    }

    operations.push({
      kind,
      targetId,
      decision,
      operationId: saved.operationId,
    });
  }

  return operations;
}
