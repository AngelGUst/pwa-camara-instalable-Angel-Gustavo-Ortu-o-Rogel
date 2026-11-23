const CACHE_NAME = 'pwa-camara-v5';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cacheOpen) => {
                return cacheOpen.addAll([
                    './',
                    './index.html',
                    './styles.css',
                    './app.js',
                    './manifest.json',
                    './icons/icon-192.png',
                    './icons/icon-512.png'
                ])
            })
    )
})

self.addEventListener('activate', (event) =>{
    console.log('SW ha sido activado')
    event.waitUntil(
        caches.keys()
            .then((cachesNames) =>{
                return Promise.all(
                    cachesNames.map((nameCache) =>{
                        if (nameCache !== CACHE_NAME) {
                            return caches.delete(nameCache);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    )
})

self.addEventListener('fetch', (event) => {
    console.log('Sw ha interceptado la peticion')
    event.respondWith(
        caches.match(event.request)
            .then((response) =>{
                return response || fetch(event.request)
            })
    )
})
