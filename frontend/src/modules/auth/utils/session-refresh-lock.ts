export const REFRESH_LOCK_NAME = "umssy_auth_refresh";

let inFlightRefreshPromise: Promise<unknown> | null = null;

/**
 * Ejecuta un refresh coordinado entre pestañas usando Web Locks y una promesa única local.
 * - En la misma pestaña: previene llamadas concurrentes compartiendo la promesa en curso.
 * - Entre pestañas: adquiere el Web Lock "umssy_auth_refresh" con { ifAvailable: true }.
 *   Si otra pestaña ya lo tiene, no duplica la petición al backend, evitando la detección de reuso de token.
 * Retorna true si este ejecutor completó el refresh, o false si otra pestaña ya lo estaba realizando.
 */
export async function executeSharedRefresh(
  performRefresh: () => Promise<unknown>,
): Promise<boolean> {
  if (inFlightRefreshPromise) {
    try {
      await inFlightRefreshPromise;
      return true;
    } catch {
      return false;
    }
  }

  // Web Locks API en navegadores modernos
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.locks?.request === "function"
  ) {
    return new Promise<boolean>((resolve) => {
      navigator.locks.request(
        REFRESH_LOCK_NAME,
        { ifAvailable: true },
        async (lock) => {
          if (!lock) {
            // Otra pestaña ya adquirió el candado y está renovando la sesión
            resolve(false);
            return;
          }

          try {
            inFlightRefreshPromise = performRefresh();
            await inFlightRefreshPromise;
            resolve(true);
          } catch {
            resolve(false);
          } finally {
            inFlightRefreshPromise = null;
          }
        },
      );
    });
  }

  // Fallback si navigator.locks no está disponible
  try {
    inFlightRefreshPromise = performRefresh();
    await inFlightRefreshPromise;
    return true;
  } catch {
    return false;
  } finally {
    inFlightRefreshPromise = null;
  }
}
