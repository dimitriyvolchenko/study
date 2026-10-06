#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
PWA_CSS = ROOT / "pwa.css"
SYNC_JS = ROOT / "sync-core.js"
PKG_MANIFEST = ROOT / "packages" / "index.json"

ASSET_START = "<!-- SINGLE-FILE ASSETS START -->"
ASSET_END = "<!-- SINGLE-FILE ASSETS END -->"
PKG_START = "<!-- SINGLE-FILE PACKAGES START -->"
PKG_END = "<!-- SINGLE-FILE PACKAGES END -->"

INLINE_INSTALLER = r'''function installBundledCourses(){
 var manEl=document.getElementById('study-inline-manifest'),man=null,changed=false;
 try{man=manEl?JSON.parse(manEl.textContent):null;}catch(e){man=null;}
 if(!man||!Array.isArray(man.list))return Promise.resolve();
 man.list.forEach(function(e){
  if(!e||!RX_PID.test(e.id||''))return;
  var pr=(Array.isArray(e.profiles)&&e.profiles.length)?e.profiles:['dad'];
  if(pr.indexOf('*')<0&&pr.indexOf(CURP)<0)return;
  if(ABSORBED.indexOf(e.id)>=0)return;
  var el=document.querySelector('script[data-study-package="'+e.id+'"]'),o=null,n=null;
  if(!el)return;
  try{o=JSON.parse(el.textContent);n=pkgNormalize(o);}catch(x){return;}
  if(!n||n.meta.id!==e.id)return;
  var old=pkgMeta(e.id),meta=n.meta,at=-1,i;
  if(old&&(old.rev||1)>(meta.rev||1))return;
  meta.origin='inline';meta.inRepo=true;meta.when=0;meta.store='inline';
  PKG_MEM[meta.id]=n.lessons;
  for(i=0;i<PKG.list.length;i++){if(PKG.list[i].id===meta.id){at=i;break;}}
  if(at>=0)PKG.list[at]=meta;else PKG.list.push(meta);
  changed=true;
 });
 if(changed){pkgCompose();renderAll();}
 return Promise.resolve();
}
'''

def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")

def safe_script(text: str) -> str:
    return (
        text.replace("</script", r"<\/script")
        .replace("\u2028", r"\u2028")
        .replace("\u2029", r"\u2029")
    )

def safe_style(text: str) -> str:
    return text.replace("</style", r"<\/style")

def replace_between(text: str, start: str, end: str, replacement: str) -> str:
    a = text.find(start)
    if a < 0:
        return text
    b = text.find(end, a)
    if b < 0:
        raise RuntimeError("Found start marker without end marker: " + start)
    return text[:a] + replacement + text[b + len(end):]

html = read(INDEX)
css = read(PWA_CSS)
sync_js = read(SYNC_JS)
manifest_text = read(PKG_MANIFEST)
manifest = json.loads(manifest_text)

# Validate all packages first and keep the exact current repository bytes.
packages = []
for entry in manifest.get("list", []):
    pid = entry["id"]
    path = ROOT / "packages" / (pid + ".json")
    raw = read(path)
    obj = json.loads(raw)
    if obj.get("id") != pid:
        raise RuntimeError("Package id mismatch: " + pid)
    packages.append((pid, raw, obj))

# 1) CSS + progress merge engine become part of index.html.
asset_block = (
    ASSET_START + "\n"
    + "<style id=\"pwa-inline\">\n" + safe_style(css) + "\n</style>\n"
    + "<script id=\"sync-core-inline\">\n" + safe_script(sync_js) + "\n</script>\n"
    + ASSET_END
)
if ASSET_START in html:
    html = replace_between(html, ASSET_START, ASSET_END, asset_block)
else:
    html = re.sub(r'\s*<link\s+rel=["\']manifest["\']\s+href=["\']manifest\.webmanifest["\']\s*/?>', "", html, flags=re.I)
    html = re.sub(r'\s*<script\s+src=["\']sync-core\.js["\']\s*>\s*</script>', "", html, flags=re.I)
    html = re.sub(r'\s*<link\s+rel=["\']stylesheet["\']\s+href=["\']pwa\.css["\']\s*/?>', "", html, flags=re.I)
    if "</head>" not in html:
        raise RuntimeError("</head> not found")
    html = html.replace("</head>", asset_block + "\n</head>", 1)

# Remove any stale external duplicates even on later builds.
html = re.sub(r'\s*<link\s+rel=["\']manifest["\']\s+href=["\']manifest\.webmanifest["\']\s*/?>', "", html, flags=re.I)
html = re.sub(r'\s*<script\s+src=["\']sync-core\.js["\']\s*>\s*</script>', "", html, flags=re.I)
html = re.sub(r'\s*<link\s+rel=["\']stylesheet["\']\s+href=["\']pwa\.css["\']\s*/?>', "", html, flags=re.I)

# 2) Current project manifest and every current project become inert JSON in the HTML.
pkg_parts = [PKG_START]
pkg_parts.append(
    '<script type="application/json" id="study-inline-manifest">'
    + safe_script(manifest_text)
    + "</script>"
)
for pid, raw, _ in packages:
    pkg_parts.append(
        '<script type="application/json" data-study-package="' + pid + '">'
        + safe_script(raw)
        + "</script>"
    )
pkg_parts.append(PKG_END)
pkg_block = "\n".join(pkg_parts)

if PKG_START in html:
    html = replace_between(html, PKG_START, PKG_END, pkg_block)
else:
    if "<body>" not in html:
        raise RuntimeError("<body> not found")
    html = html.replace("<body>", "<body>\n" + pkg_block, 1)

# 3) Replace network-only bundled-course bootstrap with an in-memory inline bootstrap.
a = html.find("function installBundledCourses(){")
b = html.find("function startPWA(){", a)
if a < 0 or b < 0:
    raise RuntimeError("Could not locate installBundledCourses/startPWA boundary")
html = html[:a] + INLINE_INSTALLER + html[b:]

# 4) A local file already contains the whole app. Service worker remains an HTTPS enhancement only.
file_mode = "Single-file mode · app and lessons are inside this file."
if file_mode not in html:
    guard = "if(!('serviceWorker' in navigator)||!window.isSecureContext){status('Offline installation needs the HTTPS site address.');return;}"
    if guard not in html:
        raise RuntimeError("PWA capability guard not found")
    repl = (
        "if(location.protocol==='file:'){status('" + file_mode
        + "');var ob=document.getElementById('offlineRetry');if(ob)ob.style.display='none';return;}\n "
        + guard
    )
    html = html.replace(guard, repl, 1)

# Keep the visible build label informative without changing app state keys.
html = re.sub(
    r'<small class="build-version">[^<]*</small>',
    '<small class="build-version">Build 2026-10-06 · Single-file</small>',
    html,
    count=1,
)

# Validation: no required static sibling CSS/JS/manifest remains.
for needle in (
    'src="sync-core.js"',
    "src='sync-core.js'",
    'href="pwa.css"',
    "href='pwa.css'",
    'href="manifest.webmanifest"',
    "href='manifest.webmanifest'",
):
    if needle in html:
        raise RuntimeError("External dependency remains: " + needle)

expected = len(packages)
actual = len(re.findall(r'<script type="application/json" data-study-package="', html))
if actual != expected:
    raise RuntimeError(f"Embedded package count {actual} != {expected}")

for pid, raw, _ in packages:
    json.loads(raw)
    if re.search(r"</script", safe_script(raw), flags=re.I):
        raise RuntimeError("Unsafe script closer remains in package " + pid)

if "meta.origin='inline'" not in html:
    raise RuntimeError("Inline package installer missing")
if file_mode not in html:
    raise RuntimeError("Local-file mode marker missing")

INDEX.write_text(html, encoding="utf-8")
print("Single-file Study build complete")
print("Embedded packages:", expected)
print("Output bytes:", INDEX.stat().st_size)
