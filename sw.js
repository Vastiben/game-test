// Fonctionnement hors ligne : après une première visite, le jeu se relance sans réseau.
// Pages : réseau d'abord (une mise à jour du jeu arrive tout de suite), cache en secours.
// Fichiers du jeu (noms à empreinte) : cache d'abord.
const CACHE = "empire-v1";

// Le garage de départ est gardé d'office : sans réseau, le premier écran a son image ; les autres se gardent à la demande.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add("./art/bureau-1-garage.webp"))
      .catch(() => undefined),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin)
    return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./", copy));
          return res;
        })
        .catch(() => caches.match("./").then((r) => r ?? Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ??
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
