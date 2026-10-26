// Guarda la app en el celular para que abra sin señal.
var CACHE = 'checklist-carga-v2';
var ARCHIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;            // los envíos al servidor no pasan por aquí
  var url = new URL(req.url);
  var esFuente = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !esFuente) return;

  if (esFuente) {
    // Tipografías: primero la copia guardada
    e.respondWith(caches.match(req).then(function (r) {
      return r || fetch(req).then(function (res) {
        var copia = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copia); }); return res;
      });
    }));
    return;
  }
  // La app: primero internet (para recibir cambios), si no hay señal la copia guardada
  e.respondWith(fetch(req).then(function (res) {
    var copia = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copia); }); return res;
  }).catch(function () {
    return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
  }));
});
