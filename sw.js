const CACHE='sth-admin-v1.1.5-cache-fix';
const CORE=['./','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.mode==='navigate' || new URL(req.url).pathname.endsWith('/index.html')){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(resp=>{
          const copy=resp.clone();
          caches.open(CACHE).then(c=>c.put(req,copy));
          return resp;
        })
        .catch(()=>caches.match(req).then(r=>r||caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>{
      const network=fetch(req).then(resp=>{
        if(req.method==='GET' && resp && resp.status===200){
          const copy=resp.clone();
          caches.open(CACHE).then(c=>c.put(req,copy));
        }
        return resp;
      }).catch(()=>cached);
      return cached||network;
    })
  );
});
