/**
 * @file client/sw.js
 * @description PWA Service Worker caching app shell and static assets for offline-first reliability.
 */

const CACHE_NAME = 'medipass-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/patient/login.html',
  '/patient/signup.html',
  '/patient/app.html',
  '/doctor/login.html',
  '/doctor/register.html',
  '/doctor/app.html',
  '/css/tokens.css',
  '/css/patient.css',
  '/css/doctor.css',
  '/css/chat.css',
  '/css/elderly.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline app shell');
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let API requests and WebSockets bypass service worker cache
  if (event.request.url.includes('/api/') || event.request.url.includes('/ws')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          // Fallback if offline
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        })
      );
    })
  );
});
