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
        actionUrl: payload.actionUrl || payload.url || '/',
      },
      tag: payload.groupKey || payload.tag || undefined,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const actionUrl = event.notification.data?.actionUrl || '/';

    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client) {
              client.navigate(actionUrl);
              return client.focus();
            }
          }
          if (self.clients.openWindow) {
            return self.clients.openWindow(actionUrl);
          }
        }),
    );
  });
})();
