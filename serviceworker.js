const CACHE_VERSION = 'v1';
const CACHE_NAME = `monaco-editor-cache-${CACHE_VERSION}`;

/**
 * キャッシュしない例外リスト（先頭一致 or RegExp）
 */
const EXCLUDE_PATTERNS = [
  '/api/',
  '/auth/',
  /^\/socket\/io/,
];

function isExcluded(request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    return EXCLUDE_PATTERNS.some(p => {
      if (typeof p === 'string') return pathname.startsWith(p);
      if (p instanceof RegExp) return p.test(pathname);
      return false;
    });
  } catch (e) {
    return false;
  }
}

self.addEventListener('install', (event) => {
  // プリキャッシュなし、ただちに activate 可能にする
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // 古いキャッシュを削除してクライアントを制御
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 非GETはネットワーク優先（キャッシュしない）
  if (req.method !== 'GET') {
    event.respondWith(
      fetch(req).catch(() => new Response('Network error', { status: 503 }))
    );
    return;
  }

  // 例外パスはキャッシュしない（ネットワーク優先）。ネットワーク失敗時はキャッシュフォールバックを試す。
  if (isExcluded(req)) {
    event.respondWith(
      fetch(req)
        .then(networkRes => networkRes)
        .catch(() => caches.match(req).then(cached => cached || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // 例外でなければキャッシュ優先（なければネットワーク取得してキャッシュに保存）
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkRes => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return networkRes;
      }).catch(() => {
        // オフライン時のフォールバック（必要ならパスを調整）
        return caches.match('/index.html') || new Response('Offline', { status: 503 });
      });
    })
  );
});

// クライアントからのメッセージで即時アクティベートを許可
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
