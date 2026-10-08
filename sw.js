/* STUDY-SW-NETWORK-FIRST · v006 · 2026-10-08
   Always ask the network for the HTML shell. Offline fallback uses the versioned cache.
   Never cache progress responses, wipe storage, or alter profile data. */
const VERSION='2026-10-08-6';
const SHELL='study-pwa-shell-'+VERSION;
const COURSES='study-pwa-courses-v1';
const BASE=new URL('./',self.location.href);
const url=p=>new URL(p,BASE).href;
const FILES=['index.html','sync-core.js','pwa.css','manifest.webmanifest',
 'icons/icon-180.png','icons/icon-192.png','icons/icon-512.png',
 'bundled/index.json','bundled/dad-french.json','bundled/mom-ege.json',
 'bundled/mom-starlight9.json','bundled/serge-spotlight3.json',
 'bundled/yulia-spotlight6.json'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(SHELL);
 try{
  await cache.addAll(FILES.map(p=>new Request(url(p),{cache:'reload'})));
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
  if(response.ok)await cache.put(key,response.clone());
  return response;
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
  event.respondWith(networkFirst(req,SHELL,url(rel)));
  return;
 }
 if(rel.startsWith('packages/')||/^[A-Za-z0-9._-]+\.html$/.test(rel)){
  event.respondWith(networkFirst(req,COURSES,url(rel)));
 }
});
