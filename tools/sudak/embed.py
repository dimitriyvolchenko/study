"""Embed Sudak's phone views in the existing offline, single-file Study application."""
from pathlib import Path

SOURCE = Path(__file__).resolve().parent
SCRIPTS = ("sudak-crossword-engine.js", "sudak-glass.js", "sudak-crossword.js", "sudak-integration.js")
STYLES = ("sudak-glass.css", "sudak-crossword.css")


def embed_block(html, content, start, end, anchor):
    block = f"{start}\n{content}\n{end}\n"
    if start in html:
        first = html.index(start)
        last = html.index(end, first) + len(end)
        return html[:first] + block.rstrip("\n") + html[last:]
    index = html.index(anchor)
    return html[:index] + block + html[index:]


def embed_sudak(html):
    # Upgrade existing single-file releases before refreshing the embedded Sudak sources.
    for old_build in ("v016-flat-2026-11-17", "v017-sudak-2026-11-23"):
        html = html.replace(old_build, "v018-sudak-2026-11-23")
    for old_label in ("Study v016 · Flat files · 17.11.2026", "Study v017 · Sudak · 23.11.2026"):
        html = html.replace(old_label, "Study v018 · Sudak · 23.11.2026")
    old = "target:String(w.target),\n  translation:v10Text"
    new = "target:String(w.target),\n  lang:(cfg.lang&&cfg.lang.code)||'',ipa:w.ipa||'',\n  translation:v10Text"
    html = html.replace(old, new)
    html = html.replace("if(cached&&cached.raw===raw)return cached.entries;",
                        "if(cached&&cached.raw===raw&&cached.pack===PACKS[code])return cached.entries;")
    html = html.replace("v10EntryCache[code]={raw:raw,entries:entries}",
                        "v10EntryCache[code]={raw:raw,pack:PACKS[code],entries:entries}")
    # A progress update from a sibling tab can use the same in-place refresh as cloud sync.
    html = html.replace("mergeProgress(JSON.parse(e.newValue));renderAll();",
                        "mergeProgress(JSON.parse(e.newValue));if(location.hash==='#/all')v10RenderSyncResult();else renderAll();")
    css = "\n".join((SOURCE / name).read_text(encoding="utf-8") for name in STYLES)
    js = "\n\n".join((SOURCE / name).read_text(encoding="utf-8") for name in SCRIPTS)
    if "</script" in js.lower() or "</style" in css.lower():
        raise ValueError("Unsafe closing tag in a Sudak source file")
    html = embed_block(html, '<style id="sudak-styles">\n' + css + '\n</style>',
                       "<!-- SUDAK STYLES START -->", "<!-- SUDAK STYLES END -->", "</head>")
    return embed_block(html, js, "/* SUDAK SCRIPTS START */", "/* SUDAK SCRIPTS END */",
                       "/* ---------- старт ---------- */")
