"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { auditLogService } from "../services/audit-log.service";
import type { AuditEvent } from "../types/audit-event.types";
import type { OpenEvidence } from "../types/audit-log-component-props.types";

// Descarga la evidencia del evento como URL de objeto y la libera al cerrar o desmontar
export function useEvidenceViewer() {
  const [opened, setOpened] = useState<OpenEvidence | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  const requestRef = useRef(0);
  // Al cerrar el visor, el foco vuelve al botón que lo abrió
  const triggerRef = useRef<HTMLElement | null>(null);

  const releaseUrl = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  };

  useEffect(() => releaseUrl, []);

  async function open(event: AuditEvent, trigger?: HTMLElement | null) {
    if (!event.evidence || loadingId === event.id) return;
    triggerRef.current = trigger ?? null;
    const requestId = ++requestRef.current;
    setLoadingId(event.id);
    const result = await auditLogService.getEvidenceBlob(event.id);
    // Si se cerró o se pidió otro documento mientras cargaba, esta respuesta se descarta
    if (requestId !== requestRef.current) return;
    setLoadingId(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    releaseUrl();
    urlRef.current = URL.createObjectURL(result.data);
    setOpened({ event, url: urlRef.current });
  }

  function close() {
    requestRef.current++;
    setLoadingId(null);
    releaseUrl();
    setOpened(null);
  }

  return { opened, loadingId, triggerRef, open, close };
}
