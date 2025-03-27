self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('hospital-v1').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/css/style.css',
                '/js/app.js'
            ]);
        })
    );
});