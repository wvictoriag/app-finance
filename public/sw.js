// Service Worker for PWA - Production Ready
const CACHE_NAME = 'guapacha-finance-v4.0';

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
    console.log('[SW] Installing version 4.0');
    self.skipWaiting();
});

// Activate event - clean up ALL old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating version 4.0');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch event - Network First strategy (safer for SPAs)
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API calls (Supabase)
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Only cache successful responses
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('[SW] Serving from cache:', event.request.url);
                        return cachedResponse;
                    }
                    // If no cache, return a basic offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});
