'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { attendanceCheckInService } from '../services/attendance-check-in.service';
import { parseAttendanceReference } from '../utils/attendance-reference';
import { getAttendanceCheckInError } from '../utils/attendance-check-in-error';
import type { AttendancePanelState } from '../types/attendance-panel-state.types';

export function useAttendanceCheckIn(workshopId: string) {
  const [panel, setPanel] = useState<AttendancePanelState | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const pendingRef = useRef(false);
  const mutation = useMutation({
    mutationFn: ({ reference, controller }: { reference: string; controller: AbortController }) =>
      attendanceCheckInService.checkIn(workshopId, reference, controller.signal),
    onSuccess: (result, { controller }) => { if (!controller.signal.aborted) setPanel({ kind: result }); },
    onError: (error: unknown, { controller }) => { if (!controller.signal.aborted) setPanel(getAttendanceCheckInError(error)); },
    onSettled: () => { requestRef.current = null; pendingRef.current = false; },
  });

  useEffect(() => () => { requestRef.current?.abort(); }, []);

  function capture(value: string): boolean {
    if (pendingRef.current || panel) return true;
    const reference = parseAttendanceReference(value);
    if (!reference) {
      setPanel({ kind: 'invalid', message: 'Formato de pase no reconocido. Ingresa una referencia válida o vuelve a escanear.' });
      return true;
    }
    pendingRef.current = true;
    setPanel({ kind: 'verifying' });
    const controller = new AbortController();
    requestRef.current = controller;
    mutation.mutate({ reference, controller });
    return true;
  }

  return { panel, capture, dismiss: () => setPanel(null) };
}
