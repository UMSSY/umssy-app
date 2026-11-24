import { act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHookWithQuery } from '@/shared/testing/render-hook-with-query';
import { certificationsService } from '@/modules/certifications';
import { verificationApi } from '../services/document-verification.service';
import type { DocumentVerification } from '../types/document-verification.types';
import { useVerificationDashboard } from './use-verification-dashboard';

const doc: DocumentVerification = {
  id: 'version',
  sourceId: 'certificate',
  sourceType: 'certification',
  filename: 'Cert.pdf',
  mime: 'application/pdf',
  sizeBytes: 3,
  noticeRead: false,
  radarVersion: null,
  publishedIds: [],
  status: 'approved',
  confidence: 1,
  reason: '',
  active: true,
  synced: true,
  available: true,
  createdAt: '2026-11-16T00:00:00Z',
  decidedAt: '2026-11-16T00:01:00Z',
  skills: [],
};
afterEach(() => vi.restoreAllMocks());
describe('Mutaciones del dashboard documental', () => {
  it('permite reintentar la eliminación fallida sin cerrar la confirmación', async () => {
    const remove = vi
      .spyOn(certificationsService, 'deleteDocument')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(undefined);
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHookWithQuery(() =>
      useVerificationDashboard({ rows: [doc], refresh }),
    );
    act(() => result.current.setRemove(doc));
    act(() => result.current.erase());
    await waitFor(() =>
      expect(result.current.error).toContain('No se pudo eliminar'),
    );
    expect(result.current.remove).toBe(doc);
    expect(refresh).not.toHaveBeenCalled();
    act(() => result.current.erase());
    await waitFor(() => expect(result.current.remove).toBeNull());
    expect(remove).toHaveBeenNthCalledWith(2, 'certificate', 'version');
    expect(refresh).toHaveBeenCalledOnce();
  });
  it('confirma la lectura con mutación y refresca solo al completarse', async () => {
    const acknowledge = vi
      .spyOn(verificationApi, 'acknowledge')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(undefined);
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHookWithQuery(() =>
      useVerificationDashboard({ rows: [doc], refresh }),
    );
    act(() => result.current.acknowledge(doc));
    await waitFor(() =>
      expect(result.current.error).toContain('confirmar la lectura'),
    );
    expect(refresh).not.toHaveBeenCalled();
    act(() => result.current.acknowledge(doc));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(acknowledge).toHaveBeenNthCalledWith(2, doc, expect.anything());
  });
});
