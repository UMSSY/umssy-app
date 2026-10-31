"use client";

import { useSyncExternalStore } from "react";
import { getDocumentCorrectionToken, removeDocumentCorrectionToken } from "../utils/document-correction-link";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const getSnapshot = () => window.location.hash;
const getServerSnapshot = () => "";

export function useDocumentCorrectionGrant() {
  const fragment = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const token = getDocumentCorrectionToken(fragment);

  // Solo se retira después de la confirmación del servidor. Una respuesta
  // anterior no debe borrar un permiso que cambió mientras se enviaba.
  function clearConfirmedToken(confirmedToken: string) {
    if (getDocumentCorrectionToken(window.location.hash) !== confirmedToken) return;
    const next = `${window.location.pathname}${window.location.search}${removeDocumentCorrectionToken(window.location.hash)}`;
    window.history.replaceState(window.history.state, "", next);
    window.dispatchEvent(new Event("hashchange"));
  }

  return { token, clearConfirmedToken };
}
