STUDY v011 — 26 OCTOBER 2026
Cozy Sudak

UPLOAD THESE FOUR FILES TO THE ROOT OF dimitriyvolchenko/study

index.html
sync-core.js
sw.js
refresh.html

Extract this ZIP first. Upload the four files together, replacing their existing
names. Do not upload the ZIP as the app, and do not put the files in a new subfolder.
The supplied sync-core.js is unchanged from v010 and matches the current repository;
it is included so this is a consistent complete deployment set.

Leave progress*.json, packages/, study-media/, images and all other files alone.
The README, TEST_REPORT and checksums are reference documents, not app files.
No live GitHub files or user progress were changed while preparing this release.

After GitHub Pages finishes publishing, open this address in Safari on each device:
https://dimitriyvolchenko.github.io/study/refresh.html
Press Update app now. Alternatively use the existing Force update control.
Cloud should show: Study v011 · 26.10.2026 · Cozy Sudak

Do not clear Safari data or uninstall the existing Home Screen app to update.
Export a backup first if a device contains work that has not yet been saved.

THE NEW SUDAK LISTS

Every selected word pack has its section's existing circular icon, section title
and Korean caption. The top learned-count summary remains available. The cards use
warm cream in light mode and warm brown in dark mode, with rounded borders and
fine dashed separators.

Russian meanings appear first. The existing English, French, Bashkir or other
source-language word follows in the accent color. The Russian meanings, source
words and section headings share the same responsive type size (17–20 CSS pixels).
All source translations are retained, including multiple meanings; long meanings
wrap rather than being silently removed. Russian-only subjects retain the supplied
Russian definitions/terms; this release does not invent English translations.

Etymology uses the same original text as v010. By default the view is a one- or
two-line preview; longer notes have an ellipsis button. Tap it to read the complete
original explanation and tap the minus button to return to two lines. Expansion
is a temporary view preference, not a study-progress mark. Notes are not rewritten
or replaced by mnemonic associations. Missing etymology is explicitly labelled:
“Этимология в этом уроке не указана.”

At the bottom of each list, use the existing handle or up/down buttons to move
that complete list. The ordering stays independent of Rocket and uses the same
saved profile preference and Cloud synchronization as before. The C button still
opens the separate recall test. Emoji controls remain available.

PREVIOUS FEATURES RETAINED

This is a presentation-only extension of v010. Rocket Refresh/Refresh all for today,
its daily badge count, the opaque red header, the inset 눈 touch lock, verified
Hard save, the updater, the combined five-subdivision reviews, the photo gallery,
menu ordering and the existing progress namespaces remain in the app.
The freeze and synchronization implementations were not rewritten by this release.

BASE AND CONTENT INTEGRITY

The starting HTML matches the current GitHub index blob:
acb14898089681ff48dabae983a83f44b6912c6f
(index commit 3f44ec0e3d24bf37fc06b2c6b2ee08796ec14e0a, 26 October 2026).
It was reconstructed from the delivered v010 file using the exact final autobuild
whitespace diff and verified by its Git blob SHA-1. This is not an older v008 base.
All 334 inert source data/template/package/media blocks are unchanged. Both existing
SINGLE-FILE generated regions are unchanged; the new styles are outside those regions.

TESTING BOUNDARIES

See TEST_REPORT.md for the actual final test results. Browser tests used isolated
Chromium with test storage, not your real phone/iPad progress. A second context
verified the existing Cloud merge of exported progress without a live GitHub write.
Physical iPhone/iPad Safari, native badge display and a live Pages deployment were
not tested here. This archive is prepared for your manual publication.
