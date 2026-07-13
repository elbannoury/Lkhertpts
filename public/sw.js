// PITSIKY service worker — enables "Add to Home Screen" / desktop install,
// and handles real Web Push notifications (orders, contact messages, chat).

const CACHE_NAME = 'pitsiky-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal pass-through fetch handler. We intentionally do NOT cache API/data
// responses (Supabase calls) — only requesting installability here, not an
// offline-first app. This keeps behavior predictable and avoids stale data.
self.addEventListener('fetch', () => {
  // no-op: let the network handle every request normally
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'PITSIKY', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'PITSIKY';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/owner' },
    tag: data.tag || undefined,
    renotify: !!data.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/owner';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      for (const client of clientList) {
        if ('focus' in client) { client.focus(); if ('navigate' in client) client.navigate(targetUrl); return; }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});
