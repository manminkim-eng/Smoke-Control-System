/* ════════════════════════════════════════════════════════════════
   Service Worker — 제연설비 설계 계산서 MANMIN Ver-5.0
   ㈜대성건축사사무소 · 건축사 김만민

   v5.0.1 (2026-09-01)
   ─────────────────────────────────────────────────────────────
   [변경 사유] 기존 전략은 문서(HTML)까지 Cache-First 였다.
   그 결과 index.html 을 수정·배포해도 사용자의 첫 화면에는
   언제나 캐시된 구버전이 떴다. Stale-While-Revalidate 였기에
   "두 번 새로고침해야 보이는" 증상으로 나타났다.

   [처방] 문서 요청만 Network-first 로 분리한다.
          정적 자산은 오프라인 지원을 위해 Cache-First 를 유지한다.
   ⛔ 이 navigate 분기를 제거하지 말 것. 제거하면 배포가 화면에 반영되지 않는다.
════════════════════════════════════════════════════════════════ */

/* §17-1 (2026-09-02) — 도구 고유 접두어. 종전 `k !== CACHE_NAME` 필터는 같은 origin 의 39종 캐시를 전부 지웠다 */
const PREFIX      = 'jeyeon-';
const CACHE_NAME  = 'jeyeon-v5.0.2';
const ORPHAN      = ['jeyeon-v5.0', 'jeyeon-v5.0.1'];
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

/* ── Install: 정적 파일 캐시 ──
   개별 실패가 설치 전체를 무너뜨리지 않도록 allSettled 로 감싼다.
   (cache.addAll 은 하나라도 404 면 설치가 통째로 실패한다) */
self.addEventListener('install', function(e){
  console.log('[SW] Install:', CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){
        return Promise.allSettled(
          STATIC_URLS.map(function(u){
            return cache.add(u).catch(function(err){
              console.warn('[SW] precache skip:', u, err);
            });
          })
        );
      })
      .then(function(){
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
            .filter(function(k){ return k !== CACHE_NAME && (k.indexOf(PREFIX) === 0 || ORPHAN.indexOf(k) !== -1); })
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

/* ── Fetch ── */
self.addEventListener('fetch', function(e){
  /* POST · chrome-extension 등 무시 */
  if(e.request.method !== 'GET') return;
  if(!e.request.url.startsWith('http')) return;

  /* ══ ⛔ v5.0.1 핵심 ══
     HTML 문서는 Network-first.
     네트워크가 되면 항상 최신을 보여주고, 끊겼을 때만 캐시로 떨어진다. */
  if(e.request.mode === 'navigate' || e.request.destination === 'document'){
    e.respondWith(
      fetch(e.request)
        .then(function(netRes){
          if(netRes && netRes.status === 200){
            var clone = netRes.clone();
            caches.open(CACHE_NAME).then(function(c){ c.put(e.request, clone); });
          }
          return netRes;
        })
        .catch(function(){
          return caches.match(e.request)
            .then(function(c){ return c || caches.match('./index.html'); });
        })
    );
    return;
  }

  /* ══ 정적 자산: Cache-First + 백그라운드 갱신 ══ */
  e.respondWith(
    caches.match(e.request)
      .then(function(cached){
        if(cached){
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

/* ── Message ── */
self.addEventListener('message', function(e){
  if(e.data && e.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
  if(e.data && e.data.type === 'GET_VERSION' && e.ports[0]){
    e.ports[0].postMessage({ version: CACHE_NAME });
  }
  if(e.data && e.data.type === 'CLEAR_CACHE'){
    caches.keys()
      .then(function(ks){ return Promise.all(ks.map(function(k){ return caches.delete(k); })); })
      .then(function(){ if(e.ports[0]) e.ports[0].postMessage({ ok: true }); });
  }
});

console.log('[SW] loaded:', CACHE_NAME);
