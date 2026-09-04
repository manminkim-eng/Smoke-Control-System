/* ════════════════════════════════════════════════════════════════
   R25 회차 2026-09-04 — 자기 접두어 캐시 조회 · cors 프리캐시 · opaque 가드 · 캐시명 v5.0.3 (S10)
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
/* ═ R25 (2026-09-04) — SW 캐시 origin 오염 차단 (S10 · 지시서 §21-1 R25)
   전역 caches 의 match 는 origin 전체를 검색한다. manminkim-eng.github.io 는 34종이 한 origin 이라
   다른 도구 캐시의 opaque 응답이 <script crossorigin>(cors) 요청에 돌아가 스크립트가 폐기됐다
   (30 #root 빈 화면 · 40 html2canvas undefined). 자기 접두어 캐시만 조회하고, cross-origin
   프리캐시는 cors 로 받으며, opaque↔cors 불일치 시 캐시를 쓰지 않는다. */
const MM_EXCLUDE = [];   /* 내 접두어로 시작하지만 남의 캐시인 이름 (§17-1 충돌) */
const mmOwn   = (k) => k.indexOf(PREFIX) === 0 && !MM_EXCLUDE.some((x) => k.indexOf(x) === 0);
const mmReq   = (u) => (typeof u === 'string' && u.indexOf('http') === 0) ? new Request(u, { mode: 'cors' }) : u;
const mmMatch = (req, opt) => caches.keys()
  .then((ks) => ks.filter(mmOwn))
  .then((ks) => ks.reduce((p, k) => p.then((r) => r || caches.open(k).then((c) => c.match(req, opt))), Promise.resolve(undefined)))
  .then((r) => (r && r.type === 'opaque' && req && req.mode === 'cors') ? undefined : r);

const CACHE_NAME  = 'jeyeon-v5.0.3';
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
            return cache.add(mmReq(u)).catch(function(err){
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
            .filter(function(k){ return k !== CACHE_NAME && (mmOwn(k) || ORPHAN.indexOf(k) !== -1); })
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
          return mmMatch(e.request)
            .then(function(c){ return c || mmMatch('./index.html'); });
        })
    );
    return;
  }

  /* ══ 정적 자산: Cache-First + 백그라운드 갱신 ══ */
  e.respondWith(
    mmMatch(e.request)
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
