/* Versioned, atomic offline installation. Progress/API responses are never cached. */
const VERSION='2026-09-29-8';
const SHELL='study-pwa-shell-'+VERSION;
const COURSES='study-pwa-courses-v1';
const BASE=new URL('./',self.location.href);
const url=p=>new URL(p,BASE).href;
const FILES=['index.html','sync-core.js','pwa.css','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png','bundled/index.json','bundled/dad-french.json','bundled/mom-ege.json','bundled/mom-starlight9.json','bundled/serge-spotlight3.json','bundled/yulia-spotlight6.json'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(SHELL);
 try{await cache.addAll(FILES.map(p=>new Request(url(p),{cache:'reload'})));}catch(e){await caches.delete(SHELL);throw e;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Keep older shell caches while already-open clients finish; never clear user databases.
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data&&event.data.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const req=event.request,u=new URL(req.url);
 if(req.method!=='GET'||u.origin!==BASE.origin||!u.pathname.startsWith(BASE.pathname))return;
 const rel=u.pathname.slice(BASE.pathname.length);
 if(/^progress.*\.json$/.test(rel))return;
 if(req.mode==='navigate'&&(rel===''||rel==='index.html')){
  event.respondWith(caches.open(SHELL).then(c=>c.match(url('index.html'))).then(r=>r||fetch(req)));return;
 }
 if(FILES.includes(rel)){event.respondWith(caches.open(SHELL).then(c=>c.match(url(rel))).then(r=>r||fetch(req)));return;}
 if(rel.startsWith('packages/')||/^[A-Za-z0-9._-]+\.html$/.test(rel)){
  event.respondWith((async()=>{
   const c=await caches.open(COURSES),key=url(rel);
   try{const r=await fetch(req);if(r.ok)await c.put(key,r.clone());return r;}catch(e){const saved=await c.match(key);if(saved)return saved;throw e;}
  })());
 }
});
