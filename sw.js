/* STUDY-SW-NETWORK-FIRST · v018 Sudak · 2026-11-23
   Always ask the network for the HTML shell. Offline fallback uses the versioned cache.
   Never cache progress responses, wipe storage, or alter profile data. */
const VERSION='2026-11-23-sudak2';
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
 "packages_pooh_expertology_full_book.json",
 "packages_se2001_full_unit_1.json",
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
  if(await readShellBuild(response)!==SHELL_BUILD)throw new Error('Study shell and worker versions do not match');
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
const SHELL_BUILD = 'v018-sudak-2026-11-23';

// The release marker precedes the inline app icon. Only inspect the first 4 KiB.
async function readShellBuild(response) {
 const probe = response.clone();
 if (!probe.body) return '';
 const reader = probe.body.getReader();
 const decoder = new TextDecoder();
 let header = '', remaining = 4096;
 try {
  while (remaining > 0) {
   const {value, done} = await reader.read();
   if (done) break;
   const count = Math.min(remaining, value.byteLength);
   header += decoder.decode(value.subarray(0, count), {stream:true});
   remaining -= count;
   const marker = header.match(/<meta\s+name=["']study-build["']\s+content=["']([^"']+)["']/i);
   if (marker) return marker[1];
  }
  return '';
 } finally {
  // Cancellation of one half of a tee may wait for the original response.
  reader.cancel().catch(() => {});
  reader.releaseLock();
 }
}

function shellGeneration(build) {
 const version = /^v(\d+)(?:-|$)/i.exec(build);
 return version ? Number(version[1]) : -1;
}
async function networkFirst(req, cacheName, key) {
 const cache = await caches.open(cacheName);
 try {
  const response = await fetch(new Request(req, {cache:'no-store'}));
  if (!response.ok) return await cache.match(key) || response;
  if (key === url('index.html')) {
   const build = await readShellBuild(response);
   if (build !== SHELL_BUILD) {
    // A later release has its own worker and offline cache.
    if (shellGeneration(build) > shellGeneration(SHELL_BUILD)) return response;
    const installed = await cache.match(key);
    if (installed) {
     if (response.body) response.body.cancel().catch(() => {});
     return installed;
    }
    return response;
   }
  }
  try { await cache.put(key, response.clone()); } catch (e) {}
  return response;
 } catch (error) {
  const offline = await cache.match(key);
  if (offline) return offline;
  throw error;
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
