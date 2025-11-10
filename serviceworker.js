const CACHE_VERSION = 'ver.2.0.a007';
const CACHE_NAME = `sw-cache-${CACHE_VERSION}`;

// 自分のドメイン（キャッシュ対象外）
const ownDomain = self.location.origin;

self.addEventListener('install', (event) => {
  console.log('SW: Install');
  // 即座にアクティベート
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activate');
  event.waitUntil(
    Promise.all([
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('sw-cache-') && cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('SW: Deleting cache', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // 全てのクライアントを制御下に置く
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // 開発環境かどうかの判定を修正
  const isDevelopment = ownDomain.includes('127.0.0.1') || ownDomain.includes('localhost');
  const isOwnDomain = requestUrl.origin === ownDomain;
  
  // 開発環境では自分のドメインはキャッシュしない
  if (isDevelopment && isOwnDomain) {
    console.log('SW: Skip cache (dev mode):', requestUrl.href);
    event.respondWith(fetch(event.request));
    return;
  }
  
  // 外部リソースのみキャッシュ
  if (!isOwnDomain) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('SW: From cache:', requestUrl.href);
            return cachedResponse;
          }
          
          console.log('SW: Fetching:', requestUrl.href);
          return fetch(event.request.clone())
            .then((response) => {
              // 成功レスポンスのみキャッシュ
              if (response && response.status === 200 && response.type === 'basic') {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              }
              return response;
            })
            .catch((error) => {
              console.error('SW: Fetch failed:', error);
              throw error;
            });
        })
    );
  } else {
    // 自分のドメインは通常通りフェッチ
    event.respondWith(fetch(event.request));
  }
});
