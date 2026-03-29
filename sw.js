/* ════════════════════════════════════════════════════════════════
   Service Worker — 제연설비 설계 계산서 MANMIN Ver-3.0
   전략: Cache-First (오프라인 완전 지원)
        + 네트워크 업데이트 감지 → 새 버전 알림
════════════════════════════════════════════════════════════════ */

const CACHE_NAME  = 'jeyeon-v3.0';
const STATIC_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.ico',
  './icons/icon-32x32.png',
  './icons/icon-16x16.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&family=Noto+Sans+Mono:wght@400;600;700&family=Orbitron:wght@700;900&display=swap'
];

/* ── Install: 정적 파일 전체 캐시 ── */
self.addEventListener('install', function(e){
  console.log('[SW] Install:', CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){
        return cache.addAll(STATIC_URLS);
      })
      .then(function(){
        /* 즉시 활성화 (waiting 스킵) */
        return self.skipWaiting();
      })
  );
});

/* ── Activate: 구버전 캐시 삭제 ── */
self.addEventListener('activate', function(e){
  console.log('[SW] Activate:', CACHE_NAME);
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(
          keys
            .filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){
              console.log('[SW] 구버전 캐시 삭제:', k);
              return caches.delete(k);
            })
        );
      })
      .then(function(){
        return self.clients.claim();
      })
  );
});

/* ── Fetch: Cache-First + 네트워크 폴백 ── */
self.addEventListener('fetch', function(e){
  /* POST · chrome-extension 등 무시 */
  if(e.request.method !== 'GET') return;
  if(!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request)
      .then(function(cached){
        if(cached){
          /* 백그라운드에서 네트워크 갱신 (Stale-While-Revalidate) */
          fetch(e.request)
            .then(function(netRes){
              if(netRes && netRes.status === 200){
                caches.open(CACHE_NAME)
                  .then(function(c){ c.put(e.request, netRes.clone()); });
              }
            })
            .catch(function(){});
          return cached;
        }
        /* 캐시 미스 → 네트워크 */
        return fetch(e.request)
          .then(function(netRes){
            if(netRes && netRes.status === 200){
              var clone = netRes.clone();
              caches.open(CACHE_NAME)
                .then(function(c){ c.put(e.request, clone); });
            }
            return netRes;
          });
      })
  );
});

/* ── Message: SKIP_WAITING (업데이트 즉시 적용) ── */
self.addEventListener('message', function(e){
  if(e.data && e.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
