/* STUDY-SW-NETWORK-FIRST · v016 flat · 2026-11-17
   Always ask the network for the HTML shell. Offline fallback uses the versioned cache.
   Never cache progress responses, wipe storage, or alter profile data. */
const VERSION='2026-11-17-flat1';
const SHELL='study-pwa-shell-'+VERSION;
const COURSES='study-pwa-courses-flat-v1';
const BASE=new URL('./',self.location.href);
const url=p=>new URL(p,BASE).href;
const FILES=[
 "bundled_dad-french.json",
 "bundled_index.json",
 "bundled_mom-ege.json",
 "bundled_mom-starlight9.json",
 "bundled_serge-spotlight3.json",
 "bundled_yulia-spotlight6.json",
 "icons_icon-180.png",
 "icons_icon-192.png",
 "icons_icon-512.png",
 "index.html",
 "manifest.webmanifest",
 "packages_dad-ege-advanced.json",
 "packages_dad-french.json",
 "packages_icon-singer.json",
 "packages_index.json",
 "packages_mom-ege.json",
 "packages_mom-starlight9.json",
 "packages_serge-school.json",
 "packages_serge-spotlight3.json",
 "packages_yulia-school.json",
 "packages_yulia-spotlight6.json",
 "pwa.css",
 "sync-core.js",
 "v016_beta_l500.jpg",
 "v016_ipod_black.jpg",
 "v016_ipod_red.jpg",
 "v016_thumb_beta_l500.png",
 "v016_thumb_ipod_black.png",
 "v016_thumb_ipod_red.png",
 "v016_thumb_walkman_sports.png",
 "v016_thumb_walkman_yellow.png",
 "v016_walkman_sports.jpg",
 "v016_walkman_yellow.png"
];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(SHELL);
 try{
  const response=await fetch(new Request(url('index.html'),{cache:'reload'}));
  if(!response.ok)throw new Error('Study shell unavailable: '+response.status);
  const text=await response.clone().text();
  if(!text.includes('v016-flat-2026-11-17'))throw new Error('Study shell and worker versions do not match');
  await cache.put(url('index.html'),response);
  await Promise.all(FILES.filter(p=>p!=='index.html').map(async p=>{
   try{const r=await fetch(new Request(url(p),{cache:'reload'}));if(r.ok)await (p.startsWith('packages_')?await caches.open(COURSES):cache).put(url(p),r);}catch(e){}
  }));
  await self.skipWaiting();
 }catch(e){await caches.delete(SHELL);throw e;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(k=>k.startsWith('study-pwa-shell-')&&k!==SHELL).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(event.data&&event.data.type==='ACTIVATE')self.skipWaiting();
});
async function networkFirst(req,cacheName,key){
 const cache=await caches.open(cacheName);
 try{
  const response=await fetch(new Request(req,{cache:'no-store'}));
  if(response.ok){try{await cache.put(key,response.clone());}catch(e){}return response;}
  const saved=await cache.match(key);if(saved)return saved;return response;
 }catch(err){
  const offline=await cache.match(key);
  if(offline)return offline;
  throw err;
 }
}
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const u=new URL(req.url);
 if(u.origin!==BASE.origin||!u.pathname.startsWith(BASE.pathname))return;
 const rel=u.pathname.slice(BASE.pathname.length);
 if(/^progress.*\.json$/i.test(rel))return;
 // New rescue page must be obtainable even by clients still running the old worker.
 if(rel==='refresh.html'){
  event.respondWith(fetch(new Request(req,{cache:'no-store'})));
  return;
 }
 if(req.mode==='navigate'&&(rel===''||rel==='index.html')){
  event.respondWith(networkFirst(req,SHELL,url('index.html')));
  return;
 }
 if(FILES.includes(rel)){
  event.respondWith(networkFirst(req,rel.startsWith('packages_')?COURSES:SHELL,url(rel)));
  return;
 }
 if(/^packages_[A-Za-z0-9._-]+\.json$/i.test(rel)||/^[A-Za-z0-9._-]+\.html$/.test(rel)){
  event.respondWith(networkFirst(req,COURSES,url(rel)));
 }
});
