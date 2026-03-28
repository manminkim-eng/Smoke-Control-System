/* ═══════════════════════════════════════════════════════════════════
   제연설비 설계 계산서  Service Worker  —  MANMIN Ver-3.0
   NFTC 501 (제연설비의 화재안전기술기준)
   ENGINEER KIM MANMIN
   ─ Cache Strategy ─
     Static (same-origin) : Cache First  → 빠른 응답, 오프라인 OK
     CDN (외부 폰트·라이브러리) : Stale-While-Revalidate → 항상 최신
     Others               : Network First → 최신 우선
═══════════════════════════════════════════════════════════════════ */

const VER          = '3.0.0';
const STATIC_CACHE = 'jeyeon-static-v' + VER;
const DYNAMIC_CACHE= 'jeyeon-dynamic-v' + VER;

/* ── 사전 캐시 목록 (핵심 파일) ── */
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.ico',
  './icons/icon-32x32.png',
  './icons/icon-96x96.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
];

/* ── CDN 도메인 (Stale-While-Revalidate) ── */
const CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
];

/* ════════════════════════════════════
   INSTALL
════════════════════════════════════ */
self.addEventListener('install', function(e) {
  console.log('[SW] Install v' + VER);
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function(cache) {
        return Promise.allSettled(
          PRECACHE.map(function(url) {
            return cache.add(new Request(url, { cache: 'reload' }));
          })
        );
      })
      .then(function() { return self.skipWaiting(); })
  );
});

/* ════════════════════════════════════
   ACTIVATE — 구버전 캐시 정리
════════════════════════════════════ */
self.addEventListener('activate', function(e) {
  console.log('[SW] Activate v' + VER);
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) {
          return k !== STATIC_CACHE && k !== DYNAMIC_CACHE;
        }).map(function(k) {
          console.log('[SW] Delete old cache:', k);
          return caches.delete(k);
        })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

/* ════════════════════════════════════
   FETCH
════════════════════════════════════ */
self.addEventListener('fetch', function(e) {
  var req = e.request;
  var url;
  try { url = new URL(req.url); } catch(_) { return; }

  if (req.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  /* CDN → Stale-While-Revalidate */
  if (CDN_HOSTS.some(function(h) { return url.hostname.includes(h); })) {
    e.respondWith(staleWhileRevalidate(req, DYNAMIC_CACHE));
    return;
  }

  /* 동일 오리진 → Cache First */
  if (url.origin === self.location.origin) {
    e.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  /* 기타 → Network First */
  e.respondWith(networkFirst(req, DYNAMIC_CACHE));
});

/* ─ Cache First ─ */
function cacheFirst(req, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(req).then(function(hit) {
      if (hit) return hit;
      return fetch(req).then(function(res) {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      }).catch(function() {
        return caches.match('./offline.html');
      });
    });
  });
}

/* ─ Stale While Revalidate ─ */
function staleWhileRevalidate(req, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(req).then(function(hit) {
      var fresh = fetch(req).then(function(res) {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      });
      return hit || fresh;
    });
  });
}

/* ─ Network First ─ */
function networkFirst(req, cacheName) {
  return fetch(req).then(function(res) {
    if (res && res.status === 200) {
      caches.open(cacheName).then(function(c) { c.put(req, res.clone()); });
    }
    return res;
  }).catch(function() {
    return caches.match(req);
  });
}

/* ════════════════════════════════════
   MESSAGE — skipWaiting (업데이트)
════════════════════════════════════ */
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING → skipWaiting()');
    self.skipWaiting();
  }
});

/* ════════════════════════════════════
   PUSH NOTIFICATION (확장용)
════════════════════════════════════ */
self.addEventListener('push', function(e) {
  var data = { title: '제연설비 MANMIN', body: '알림' };
  try { if (e.data) data = e.data.json(); } catch(_) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-72x72.png',
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(list) {
        for (var i = 0; i < list.length; i++) {
          if ('focus' in list[i]) return list[i].focus();
        }
        if (clients.openWindow) return clients.openWindow('./');
      })
  );
});

console.log('[SW] 제연설비 Service Worker v' + VER + ' ready');
