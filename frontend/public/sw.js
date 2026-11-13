const CACHE_VERSION = 'v1';
const CACHE_PREFIX = 'umssy-';
const SHELL_CACHE = `${CACHE_PREFIX}shell-${CACHE_VERSION}`;
const ASSETS_CACHE = `${CACHE_PREFIX}assets-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';
const NAVIGATION_TIMEOUT_MS = 4000;
const SHELL_ROUTES = ['/', '/events/my-passes', '/dashboard'];
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-umssy.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/umssy-simbolo-web.svg',
  '/icons/umssy-logo-web.svg',
  '/icons/umssy-logo-on-dark.svg',
  '/icons/umss-institutional-seal.svg',
];
const NEXT_STATIC_PREFIX = '/_next/static/';
const NEXT_STATIC_PATTERN = /\/_next\/static\/[^"'\s)<>\\]+/g;
const CACHE_URLS_MESSAGE = 'CACHE_URLS';

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
  return SHELL_ROUTES.includes(path) ? new URL(path, self.location.origin).href : null;
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

const putIfCacheable = async (cacheName, key, response) => {
  if (!isCacheable(response)) return false;
  const cache = await caches.open(cacheName);
  await cache.put(key, response);
  return true;
};

const fetchAndCache = async (cacheName, url) => {
  const cache = await caches.open(cacheName);
  if (await cache.match(url)) return;
  const response = await fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' }));
  await putIfCacheable(cacheName, url, response);
};

const extractNextStaticUrls = (html) =>
  [...new Set(html.match(NEXT_STATIC_PATTERN) || [])];

const precacheRoute = async (route) => {
  const response = await fetch(new Request(route, { cache: 'reload', credentials: 'same-origin' }));
  if (!isCacheable(response)) return [];
  const html = await response.clone().text();
  await putIfCacheable(SHELL_CACHE, shellKey(route), response);
  return extractNextStaticUrls(html);
};

const precache = async () => {
  const offline = await fetch(new Request(OFFLINE_URL, { cache: 'reload' }));
  if (!(await putIfCacheable(SHELL_CACHE, OFFLINE_URL, offline))) {
    throw new Error('offline fallback could not be cached');
  }
  const [, routes] = await Promise.all([
    Promise.allSettled(STATIC_ASSETS.map((url) => fetchAndCache(SHELL_CACHE, url))),
    Promise.allSettled(SHELL_ROUTES.map(precacheRoute)),
  ]);
  const assetUrls = new Set(
    routes.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])),
  );
  await Promise.allSettled([...assetUrls].map((url) => fetchAndCache(ASSETS_CACHE, url)));
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

const handleNavigation = async (event) => {
  const key = shellKey(event.request.url);
  const network = fetch(event.request);
  if (key) {
    event.waitUntil(
      network
        .then((response) => putIfCacheable(SHELL_CACHE, key, response.clone()))
        .catch(() => undefined),
    );
  }
  try {
    return await withTimeout(network, NAVIGATION_TIMEOUT_MS);
  } catch {
    const cached = key ? await caches.match(key, { cacheName: SHELL_CACHE }) : undefined;
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
  self.skipWaiting();
  event.waitUntil(precache());
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
  if (!data || data.type !== CACHE_URLS_MESSAGE || !Array.isArray(data.urls)) return;
  const urls = data.urls
    .map((value) => (typeof value === 'string' ? sameOriginUrl(value) : null))
    .filter((url) => url && isNextStatic(url.pathname) && !url.searchParams.has('_rsc'))
    .map((url) => url.href);
  event.waitUntil(Promise.allSettled(urls.map((url) => fetchAndCache(ASSETS_CACHE, url))));
});
