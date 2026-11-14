self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

(function webPushHandlers() {
  self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
      payload = event.data.json();
    } catch (error) {
      console.error('Push event payload is not valid JSON', error);
      return;
    }

    const title = payload.title || 'UMSSY';
    const options = {
      body: payload.body || 'Tienes una nueva notificación',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        actionUrl: payload.url || '/',
      },
      tag: payload.tag || undefined,
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