// Rede primeiro; o cache só entra quando não há internet. Assim uma versão nova aparece sem limpar nada.
const CACHE = "laudos-sst-v1";
const ARQUIVOS = ["./", "index.html", "app.css", "icone.svg", "manifest.webmanifest", "js/normas.js", "js/store.js", "js/docs.js", "js/telas.js", "js/app.js"];
self.addEventListener("install", (ev) => { ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS))); self.skipWaiting(); });
self.addEventListener("activate", (ev) => {
  ev.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (ev) => {
  if (ev.request.method !== "GET" || new URL(ev.request.url).origin !== location.origin) return;
  ev.respondWith(
    fetch(ev.request).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(ev.request, copia)); }
      return res;
    }).catch(() => caches.match(ev.request, { ignoreSearch: true }))
  );
});
