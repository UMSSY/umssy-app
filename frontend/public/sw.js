const CACHE_VERSION = 'v6';
const CACHE_PREFIX = 'umssy-';
const SHELL_CACHE = `${CACHE_PREFIX}shell-${CACHE_VERSION}`;
const ASSETS_CACHE = `${CACHE_PREFIX}assets-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';
const NAVIGATION_TIMEOUT_MS = 4000;
const OFFLINE_PASSES_ROUTE = '/offline/passes';
const SHELL_ROUTES = ['/', '/events/my-passes', '/dashboard', OFFLINE_PASSES_ROUTE];
const OFFLINE_ROUTE_FALLBACKS = { '/events/my-passes': OFFLINE_PASSES_ROUTE };
const REQUIRED_ROUTES = [...SHELL_ROUTES, '/login', '/events'];
const ADDITIONAL_ROUTES = [
  "/affinity-radar/review-queue",
  "/appointments",
  "/backoffice/audit",
  "/backoffice",
  "/backoffice/reports/history",
  "/backoffice/reports/registered-users",
  "/backoffice/reports/rejected-users",
  "/backoffice/solicitudes",
  "/backoffice/surveys/create",
  "/backoffice/surveys",
  "/backoffice/surveys/statistics",
  "/chat",
  "/events/my-workshops",
  "/events",
  "/events/propose",
  "/matching",
  "/mentor/availability",
  "/mentors/participation",
  "/mentors/participation/technical-areas",
  "/mentors/register/technical-areas",
  "/mentorship/mentors",
  "/mentorship/orientation",
  "/mentorship",
  "/profile/documents",
  "/profile",
  "/profile/personal-info",
  "/profile/presentation",
  "/profile/radar",
  "/profile/settings",
  "/profile/trajectory/certifications",
  "/profile/trajectory/education",
  "/profile/trajectory/experience",
  "/profile/trajectory/skills",
  "/recruiters/history",
  "/recruiters/job-offers/new",
  "/recruiters",
  "/surveys",
  "/vacancies/my-applications",
  "/vacancies",
  "/vacancies/recommended",
  "/vacancies/vacancies",
  "/forgot-password",
  "/login",
  "/request-access/activation",
  "/request-access",
  "/request-access/status",
  "/workshops"
];
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-umssy.svg',
  '/icons/icon-192x192.png',
  '/icons/notification-badge-96x96.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/umssy-simbolo-web.svg',
  '/icons/umssy-logo-web.svg',
  '/icons/umssy-logo-on-dark.svg',
  '/icons/umss-institutional-seal.svg',
];
const NEXT_STATIC_PREFIX = '/_next/static/';
const NEXT_STATIC_PATTERN = /\/_next\/static\/[^"'\s<>\\]+/g;
const CACHE_URLS_MESSAGE = 'CACHE_URLS';
const assetFetches = new Map();

const sameOriginUrl = (value) => {
  try {
    const url = new URL(value, self.location.origin);
    return url.origin === self.location.origin ? url : null;
  } catch {
    return null;
  }
};

const normalizePath = (pathname) =>
  pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

const shellKey = (value) => {
  const url = sameOriginUrl(value);
  if (!url) return null;
  const path = normalizePath(url.pathname);
  return [...SHELL_ROUTES, ...ADDITIONAL_ROUTES].includes(path) ? new URL(path, self.location.origin).href : null;
};

const isStaticAsset = (pathname) => STATIC_ASSETS.includes(pathname);
const isNextStatic = (pathname) => pathname.startsWith(NEXT_STATIC_PREFIX);

const isCacheable = (response) => {
  if (!response || !response.ok || response.redirected) return false;
  if (response.type === 'opaqueredirect' || response.type === 'opaque') return false;
  const cacheControl = response.headers.get('Cache-Control') || '';
  return !/(^|[,\s])(private|no-store)([,\s=]|$)/i.test(cacheControl);
};

const isRscRequest = (request, url) =>
  request.headers.get('RSC') !== null || url.searchParams.has('_rsc');

const discard = (response) => {
  response?.body?.cancel().catch(() => undefined);
};

const putIfCacheable = async (cacheName, key, response) => {
  if (!isCacheable(response)) {
    discard(response);
    return false;
  }
  const cache = await caches.open(cacheName);
  await cache.put(key, response);
  return true;
};

const fetchAndCache = (cacheName, value) => {
  const url = sameOriginUrl(value);
  if (!url) return;
  const key = url.href;
  if (assetFetches.has(key)) return assetFetches.get(key);
  const pending = (async () => {
    const cache = await caches.open(cacheName);
    if (await cache.match(key)) return true;
    const response = await fetch(new Request(key, { cache: 'reload', credentials: 'omit' }));
    return putIfCacheable(cacheName, key, response);
  })().finally(() => assetFetches.delete(key));
  assetFetches.set(key, pending);
  return pending;
};

const extractNextStaticUrls = (html) =>
  [...new Set(html.match(NEXT_STATIC_PATTERN) || [])];

const precacheRoute = async (route) => {
  const key = shellKey(route);
  const response = await fetch(new Request(key, { cache: 'reload', credentials: 'omit', headers: { 'X-UMSSY-Offline-Shell': '1' } }));
  return cacheShell(key, response);
};

const cacheShell = async (key, response) => {
  if (!isCacheable(response) || !response.headers.get('Content-Type')?.startsWith('text/html')) {
    discard(response);
    return;
  }
  const html = await response.clone().text();
  const assets = await Promise.all(extractNextStaticUrls(html).map((url) => fetchAndCache(ASSETS_CACHE, url)));
  if (assets.some((saved) => !saved)) {
    discard(response);
    return false;
  }
  return putIfCacheable(SHELL_CACHE, key, response);
};

const precache = async () => {
  const offline = await fetch(new Request(new URL(OFFLINE_URL, self.location.origin), { cache: 'reload' }));
  if (!(await putIfCacheable(SHELL_CACHE, OFFLINE_URL, offline))) {
    throw new Error('offline fallback could not be cached');
  }
  await Promise.all([
    Promise.allSettled(STATIC_ASSETS.map((url) => fetchAndCache(SHELL_CACHE, url))),
    Promise.all(REQUIRED_ROUTES.map(precacheRoute)).then((routes) => {
      if (!routes.every(Boolean)) throw new Error('required offline routes could not be cached');
    }),
    Promise.allSettled(ADDITIONAL_ROUTES.filter((route) => !REQUIRED_ROUTES.includes(route)).map(precacheRoute)),
  ]);
};

const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

const offlineFallback = async () =>
  (await caches.match(OFFLINE_URL, { cacheName: SHELL_CACHE })) || Response.error();

const offlineRouteFor = (key) => {
  const fallback = OFFLINE_ROUTE_FALLBACKS[new URL(key).pathname];
  return fallback ? shellKey(fallback) : null;
};

const isTimeout = (error) => error instanceof Error && error.message === 'timeout';

const handleNavigation = async (event) => {
  const key = shellKey(event.request.url);
  const network = fetch(event.request);
  if (key) {
    event.waitUntil(
      network
        .then((response) => {
          if (!isCacheable(response)) return;
          return precacheRoute(key);
        })
        .catch(() => undefined),
    );
  }
  try {
    return await withTimeout(network, NAVIGATION_TIMEOUT_MS);
  } catch (error) {
    const offline = self.navigator?.onLine === false || !isTimeout(error);
    const offlineKey = key && offline ? offlineRouteFor(key) : null;
    const cached =
      (offlineKey ? await caches.match(offlineKey, { cacheName: SHELL_CACHE }) : undefined) ||
      (key ? await caches.match(key, { cacheName: SHELL_CACHE }) : undefined);
    if (cached) return cached;
    try {
      return await network;
    } catch {
      return offlineFallback();
    }
  }
};

const cacheFirst = async (event) => {
  const cached = await caches.match(event.request, { cacheName: ASSETS_CACHE });
  if (cached) return cached;
  const response = await fetch(event.request);
  event.waitUntil(putIfCacheable(ASSETS_CACHE, event.request, response.clone()).catch(() => undefined));
  return response;
};

const staleWhileRevalidate = async (event) => {
  const network = fetch(event.request).then((response) => {
    event.waitUntil(putIfCacheable(SHELL_CACHE, event.request, response.clone()).catch(() => undefined));
    return response;
  });
  const cached = await caches.match(event.request, { cacheName: SHELL_CACHE });
  if (cached) {
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  return network;
};

const selectStrategy = (request) => {
  if (request.method !== 'GET') return null;
  const url = sameOriginUrl(request.url);
  if (!url) return null;
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return null;
  if (url.pathname.startsWith('/_next/image')) return null;
  if (isRscRequest(request, url)) return null;
  if (request.mode === 'navigate') return handleNavigation;
  if (isNextStatic(url.pathname)) return cacheFirst;
  if (isStaticAsset(url.pathname)) return staleWhileRevalidate;
  return null;
};

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  const current = [SHELL_CACHE, ASSETS_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(CACHE_PREFIX) && !current.includes(name))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const strategy = selectStrategy(event.request);
  if (strategy) event.respondWith(strategy(event));
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data?.type === 'PREPARE_OFFLINE_PASSES' && event.ports?.[0]) {
    event.waitUntil(Promise.all(REQUIRED_ROUTES.map(precacheRoute)).then(
      (routes) => event.ports[0].postMessage(routes.every(Boolean)),
      () => event.ports[0].postMessage(false),
    ));
    return;
  }
  if (!data || data.type !== CACHE_URLS_MESSAGE || !Array.isArray(data.urls)) return;
  const urls = data.urls
    .map((value) => (typeof value === 'string' ? sameOriginUrl(value) : null))
    .filter((url) => url && isNextStatic(url.pathname) && !url.searchParams.has('_rsc'))
    .map((url) => url.href);
  event.waitUntil(Promise.allSettled([
    ...urls.map((url) => fetchAndCache(ASSETS_CACHE, url)),
    // Recover routes missed during installation, even after client-side navigation.
    ...SHELL_ROUTES.map(async (route) => {
      const key = shellKey(route);
      if (!(await caches.match(key, { cacheName: SHELL_CACHE }))) await precacheRoute(key);
    }),
  ]));
});

(function webPushHandlers() {
  const PUSH_TEXT_MAX_LENGTH = 100;
  const PUSH_DEFAULT_TITLE = 'UMSSY';
  const PUSH_DEFAULT_BODY = 'Tienes una nueva notificación';
  const PUSH_DEFAULT_ICON = '/icons/icon-192x192.png';
  // Android pinta el badge solo con el canal alfa: debe ser una silueta
  // blanca sobre fondo transparente, no el ícono a color (ROSEMARY-492).
  const PUSH_BADGE_ICON = '/icons/notification-badge-96x96.png';
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
      badge: PUSH_BADGE_ICON,
      data: {
        actionUrl: payload.actionUrl || payload.url || PUSH_DEFAULT_URL,
        notificationId: payload.notificationId || null,
      },
    };

    const tag = payload.groupKey || payload.tag;
    if (tag) {
      options.tag = tag;
      options.renotify = true;
    }

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