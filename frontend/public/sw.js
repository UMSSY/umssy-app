self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

(function webPushHandlers() {
  const PUSH_TEXT_MAX_LENGTH = 100;
  const PUSH_DEFAULT_TITLE = 'UMSSY';
  const PUSH_DEFAULT_BODY = 'Tienes una nueva notificación';
  const PUSH_DEFAULT_ICON = '/icons/icon-192x192.png';
  const PUSH_DEFAULT_URL = '/dashboard';
  const NOTIFICATION_OPEN_PATH = '/notifications/open';

  function isInternalPath(value) {
    return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\');
  }

  function readPushPayload(event) {
    if (!event.data) return {};
    try {
      return event.data.json() || {};
    } catch (error) {
      console.error('Push event payload is not valid JSON', error);
      return {};
    }
  }

  self.addEventListener('push', (event) => {
    const payload = readPushPayload(event);

    const title = String(payload.title || PUSH_DEFAULT_TITLE).slice(0, PUSH_TEXT_MAX_LENGTH);
    const options = {
      body: String(payload.body || PUSH_DEFAULT_BODY).slice(0, PUSH_TEXT_MAX_LENGTH),
      icon: payload.icon || PUSH_DEFAULT_ICON,
      badge: PUSH_DEFAULT_ICON,
      data: {
        actionUrl: payload.actionUrl || payload.url || PUSH_DEFAULT_URL,
        notificationId: payload.notificationId || null,
      },
      tag: payload.groupKey || payload.tag || undefined,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  });

  function resolveClickTarget(data) {
    const actionUrl = isInternalPath(data.actionUrl) ? data.actionUrl : PUSH_DEFAULT_URL;
    if (!data.notificationId) return actionUrl;

    const params = new URLSearchParams({ id: data.notificationId, to: actionUrl });
    return `${NOTIFICATION_OPEN_PATH}?${params.toString()}`;
  }

  async function focusOrOpenWindow(targetUrl) {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const appWindow = windows.find((client) => new URL(client.url).origin === self.location.origin);

    if (appWindow) {
      try {
        await appWindow.focus();
        await appWindow.navigate(targetUrl);
        return;
      } catch (error) {
        console.error('Could not reuse the open UMSSY window', error);
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  }

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = resolveClickTarget(event.notification.data || {});
    event.waitUntil(focusOrOpenWindow(targetUrl));
  });
})();
