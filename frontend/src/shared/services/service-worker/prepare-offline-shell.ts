export async function prepareOfflineShell(signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const { port1, port2 } = new MessageChannel();
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      port1.close();
      port2.close();
      if (ready) resolve();
      else reject(new Error('No se pudo preparar la navegación sin conexión.'));
    };
    const abort = () => finish(false);
    const timeout = window.setTimeout(abort, 30_000);
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
    port1.onmessage = ({ data }) => finish(data === true);
    void navigator.serviceWorker.ready
      .then(({ active }) => {
        if (settled) return;
        if (!active || signal.aborted) return finish(false);
        active.postMessage({ type: 'PREPARE_OFFLINE_PASSES' }, [port2]);
      })
      .catch(abort);
  });
}
