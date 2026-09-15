var CACHE = "wordfamilies-v18";
var ASSETS = ["./", "./index.html", "./story.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(ASSETS.map(function(url){
        return c.add(url).catch(function(){ return null; });
      }));
    })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                          .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  if (e.request.method !== "GET") return;

  var path = "";
  try { path = new URL(e.request.url).pathname; } catch (err) {}
  var isPage = e.request.mode === "navigate" ||
               e.request.destination === "document" ||
               path.slice(-5) === ".html" ||
               path.slice(-1) === "/";

  if (isPage) {
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
        return res;
      }).catch(function(){
        return caches.match(e.request).then(function(hit){
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(hit){
      if (hit) return hit;
      return fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
        return res;
      });
    })
  );
});
