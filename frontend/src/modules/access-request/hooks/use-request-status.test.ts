import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRequestStatus } from './use-request-status';

describe('useRequestStatus', () => {
  it('devuelve datos de ejemplo con el código de solicitud recibido', () => {
    const { result } = renderHook(() => useRequestStatus('SOL-2026-0777'));

    expect(result.current.data?.requestCode).toBe('SOL-2026-0777');
    expect(result.current.data?.status).toBe('IN_REVIEW');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
