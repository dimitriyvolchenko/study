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
    # Permit direct builds from the v016 source and repeated builds of v017.
    html = html.replace("v016-flat-2026-11-17", "v017-sudak-2026-11-23")
    html = html.replace("Study v016 · Flat files · 17.11.2026", "Study v017 · Sudak · 23.11.2026")
    old = "target:String(w.target),\n  translation:v10Text"
    new = "target:String(w.target),\n  lang:(cfg.lang&&cfg.lang.code)||'',ipa:w.ipa||'',\n  translation:v10Text"
    html = html.replace(old, new)
    html = html.replace("if(cached&&cached.raw===raw)return cached.entries;",
                        "if(cached&&cached.raw===raw&&cached.pack===PACKS[code])return cached.entries;")
    html = html.replace("v10EntryCache[code]={raw:raw,entries:entries}",
                        "v10EntryCache[code]={raw:raw,pack:PACKS[code],entries:entries}")
    css = "\n".join((SOURCE / name).read_text(encoding="utf-8") for name in STYLES)
    js = "\n\n".join((SOURCE / name).read_text(encoding="utf-8") for name in SCRIPTS)
    if "</script" in js.lower() or "</style" in css.lower():
        raise ValueError("Unsafe closing tag in a Sudak source file")
    html = embed_block(html, '<style id="sudak-v017">\n' + css + '\n</style>',
                       "<!-- SUDAK STYLES START -->", "<!-- SUDAK STYLES END -->", "</head>")
    return embed_block(html, js, "/* SUDAK SCRIPTS START */", "/* SUDAK SCRIPTS END */",
                       "/* ---------- старт ---------- */")
