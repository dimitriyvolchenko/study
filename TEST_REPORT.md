# Study v011 — Cozy Sudak: test report

Release date: 26 October 2026.
Build marker: `v011-2026-10-26-cozy-sudak`.

## Result

**68 / 68 final browser assertions passed.** The final report was generated only
from the completed run against the packaged index.html. JavaScript syntax checks
also passed. Final mobile and tablet screenshots were inspected visually.

## Source and scope

The starting HTML is the current repository index blob
`acb14898089681ff48dabae983a83f44b6912c6f`, from index commit
`3f44ec0e3d24bf37fc06b2c6b2ee08796ec14e0a` (26 October 2026).
It was reconstructed from the delivered v010 archive using the exact final
GitHub autobuild whitespace diff; its Git blob SHA-1 was verified before editing.
The current repository sync-core blob is
`f5d952860b43e3135278003459e33e9a6c718511` and remains unchanged.

This release changes the Sudak presentation, plus coordinated app/updater/worker
version identifiers. It does not rewrite source vocabulary or etymology, reset
progress, change queue membership, or introduce a new progress-storage schema.

## Static integrity

- All **334** inert source data/template/package/media blocks retain their exact
  original attributes and contents.
- Both existing SINGLE-FILE ASSETS and SINGLE-FILE PACKAGES regions remain unchanged.
- The new Sudak CSS is outside those generated regions so the existing autobuilder
  does not replace it.
- All five executable inline script blocks pass `node --check`.
- The service worker, synchronization script, and updater script pass `node --check`.
- The v011 HTML build marker matches the service worker's installation guard.
- The supplied sync-core.js is byte-identical to the current v010 synchronization file.

## Browser coverage

Tests ran in headless Chromium using Playwright on Linux. Each context used
isolated in-memory localStorage/sessionStorage. External requests were blocked
or answered with a test response. No real GitHub credentials, saved progress, or
repository files were written. Badge calls were mocked and are not native-badge
verification. Test screenshots show sample test selections/results, not the user's
current progress.

Selected English, French, Bashkir and Criminalistics packs were checked for exact
source text, matching headline sizes, two-line etymology previews, accessible
expansion/collapse, and saved ordering. The missing-etymology path used an explicit
in-browser fixture; the fixture did not modify the packaged lessons.

Every populated source pack in all four profiles was also rendered through the
new generator. Pack and entry counts and primary Russian text were checked:

| Profile | Packs | Entries | Mismatches |
| --- | ---: | ---: | ---: |
| dad | 364 | 2054 | 0 |
| mom | 114 | 615 | 0 |
| yulia | 100 | 500 | 0 |
| serge | 40 | 200 | 0 |

The interface was checked at **320, 393, 430, 768 and 1024 CSS pixels**, in both
light and dark themes. All tested widths have no horizontal overflow. The Russian
meanings, source-language words, and section headings share one responsive text
size. Collapsed etymology is at most two lines; expanded text remains the original
complete explanation rather than a newly written summary.

Existing reorder arrow controls and a pointer drag from the relocated bottom
handle were exercised. Saved order remained independent from Rocket and survived
a new document. The existing exported-progress merge carried order and selected
packs to a separate context; this was an in-memory merge test, not a live cloud
upload/download. C recall testing and scoring still worked; answers were not
exposed in the display list while recall mode was active. Freeze mode blocked
sample clicks/wheel scrolling without lifting the bottom navigation; holding and
releasing after two seconds unlocked it. Rocket Refresh remained idempotent, and
both Hard save controls remained present.

## Final assertion log

01. PASS — Starts as selected profile without runtime exceptions
02. PASS — Sudak remains empty without selected Rocket lessons
03. PASS — Every selected pack appears exactly once
04. PASS — Every pack has its section icon, title and Korean caption
05. PASS — Every subdivision is a cozy list
06. PASS — Words, all translations and full source etymologies preserved
07. PASS — No mnemonic/association columns or story links added
08. PASS — Missing-etymology fixture is explicitly labelled
09. PASS — Missing-etymology fixture has no false expand button
10. PASS — Russian and target words match section-heading size
11. PASS — Default etymology is at most two lines
12. PASS — Long note expands on click and exposes its original full text
13. PASS — Open note survives a Sudak rerender
14. PASS — Note collapses to two lines
15. PASS — Down arrow reorders complete lists
16. PASS — Reordering remains independent of Rocket
17. PASS — Reordering does not alter marks, queue, checks or daily history
18. PASS — Saved order survives rendering
19. PASS — Pointer drag on moved footer handle changes list order
20. PASS — C still opens recall mode
21. PASS — Recall view does not reveal display translations
22. PASS — Recall test still scores source answers
23. PASS — Returning from recall restores new word list
24. PASS — Touch freeze activates
25. PASS — Freeze does not lift bottom navigation
26. PASS — Frozen taps and swipes leave route and scroll unchanged
27. PASS — Two-second hold and release still unlocks
28. PASS — Rocket Refresh remains idempotent
29. PASS — Hard save remains present in both red bars
30. PASS — light 320px: no horizontal overflow
31. PASS — light 320px: word and heading sizes match
32. PASS — light 320px: etymology remains two-line
33. PASS — dark 320px: no horizontal overflow
34. PASS — dark 320px: word and heading sizes match
35. PASS — dark 320px: etymology remains two-line
36. PASS — light 393px: no horizontal overflow
37. PASS — light 393px: word and heading sizes match
38. PASS — light 393px: etymology remains two-line
39. PASS — dark 393px: no horizontal overflow
40. PASS — dark 393px: word and heading sizes match
41. PASS — dark 393px: etymology remains two-line
42. PASS — light 430px: no horizontal overflow
43. PASS — light 430px: word and heading sizes match
44. PASS — light 430px: etymology remains two-line
45. PASS — dark 430px: no horizontal overflow
46. PASS — dark 430px: word and heading sizes match
47. PASS — dark 430px: etymology remains two-line
48. PASS — light 768px: no horizontal overflow
49. PASS — light 768px: word and heading sizes match
50. PASS — light 768px: etymology remains two-line
51. PASS — dark 768px: no horizontal overflow
52. PASS — dark 768px: word and heading sizes match
53. PASS — dark 768px: etymology remains two-line
54. PASS — light 1024px: no horizontal overflow
55. PASS — light 1024px: word and heading sizes match
56. PASS — light 1024px: etymology remains two-line
57. PASS — dark 1024px: no horizontal overflow
58. PASS — dark 1024px: word and heading sizes match
59. PASS — dark 1024px: etymology remains two-line
60. PASS — Saved order survives a new document
61. PASS — Saved selected lessons survive a new document
62. PASS — Existing Cloud merge carries Sudak order to a second context
63. PASS — Existing Cloud merge carries selected packs
64. PASS — dad: consistent new format for every source pack
65. PASS — mom: consistent new format for every source pack
66. PASS — yulia: consistent new format for every source pack
67. PASS — serge: consistent new format for every source pack
68. PASS — No JavaScript exceptions in interaction/profile tests

## Limits

Physical iPhone/iPad Safari, native app-icon badge display, and a real GitHub Pages
deployment were not tested in this environment. A live credentialed Hard save,
real photo upload, and background push delivery were not tested in this release.
Those implementations are retained from v010, not newly verified here. No GitHub
repository changes or live progress changes were made while preparing this build.

## Publishing

Upload index.html, sync-core.js, sw.js and refresh.html together at the existing
repository root. The sync script is unchanged but supplied for a complete release
set. Leave progress*.json, packages, photos, and other files unchanged. Open
refresh.html after publication, then confirm the Cloud label reads
“Study v011 · 26.10.2026 · Cozy Sudak.”
