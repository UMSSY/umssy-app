'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { radarIntegrationApi } from '../sprint2-integration/radar-integration-api';
import { mapEpic2Radar } from './radar-mapper';
import type { RadarBridgeView } from './types';

export function useLiveRadar() {
  const [data, setData] = useState<RadarBridgeView | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variation, setVariation] = useState<number | null>(null);
  const lastSession = useRef<string | null>(null);
  const currentVersion = useRef(0);
  const inFlight = useRef<{ token: string | null; id: number } | null>(null);
  const requestId = useRef(0);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    const token = getAccessToken();
    if (lastSession.current !== token) {
      lastSession.current = token;
      currentVersion.current = 0;
      setData(null);
      setVariation(null);
      setError(null);
    }
    if (inFlight.current?.token === token) return;
    const id = ++requestId.current;
    inFlight.current = { token, id };
    const isCurrent = () => mounted.current && token === getAccessToken() && id === requestId.current;
    try {
      let stored = await radarIntegrationApi.me();
      if (!isCurrent()) return;
      if (stored.version > 0 && stored.sourceRevision === null && stored.processingStatus !== 'error') {
        // Publications created before revision tracking are upgraded once.
        // A failed upgrade is persisted by the API and uses the normal retry UI.
        try { stored = await radarIntegrationApi.recalculate(); }
        catch { stored = await radarIntegrationApi.me(); }
      }
      if (!isCurrent()) return;
      if (stored.version < currentVersion.current) return;
      currentVersion.current = stored.version;
      // Skills, evidence and scores come from the same server publication.
      const published = mapEpic2Radar({
        userId: stored.userId,
        status: 'ready',
        version: stored.version,
        updatedAt: stored.updatedAt,
        dictionaryVersion: stored.dictionaryVersion ?? null,
        skills: stored.skills.map(skill => ({ ...skill, text: skill.name, source: 'nlp' as const, verificationStatus: 'approved' as const })),
      });
      const status = stored.processingStatus === 'error'
        ? 'error'
        : stored.processingStatus === 'pending' || stored.hasPending ? 'pending' : 'ready';
      setData({
        ...published,
        status,
        processingStatus: stored.processingStatus,
        rubric: stored.rubricVersion,
        version: stored.version,
        updatedAt: stored.updatedAt,
        areas: published.areas.map(area => ({ ...area, score: stored.scores[area.id] ?? 0 })),
        average: stored.average,
        pendingCount: stored.pending,
      });
      setVariation(stored.variation);
      setError(status === 'error' ? 'No se pudo publicar la actualización. Se conserva el último radar válido.' : null);
    } catch {
      if (isCurrent()) setError('No se pudo actualizar el radar publicado. Comprueba la conexión y vuelve a intentarlo.');
    } finally {
      if (inFlight.current?.id === id) inFlight.current = null;
      if (isCurrent()) setLoading(false);
    }
  }, []);

  const retry = useCallback(async () => {
    const token = getAccessToken();
    setRetrying(true);
    try {
      await radarIntegrationApi.recalculate();
      if (mounted.current && token === getAccessToken()) await refresh();
    } catch {
      if (mounted.current && token === getAccessToken()) setError('La actualización no pudo completarse. Puedes volver a intentarlo.');
    } finally {
      if (mounted.current) setRetrying(false);
    }
  }, [refresh]);

  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(refresh);
    const timer = window.setInterval(() => { void refresh(); }, 1500);
    return () => { mounted.current = false; window.clearInterval(timer); };
  }, [refresh]);
  return { data, loading, error, variation, refresh, retry, retrying };
}
