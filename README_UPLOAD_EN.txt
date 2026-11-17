STUDY v016 — FLAT UPLOAD, VERSION 2 — 17 NOVEMBER 2026

Every file is directly at the ZIP root. There are NO folders in this archive.
App build: v016-flat-2026-11-17. This is a flat-layout correction to v016.

UPLOAD
1. Extract the ZIP.
2. Open the ROOT of https://github.com/dimitriyvolchenko/study on main.
3. Add file > Upload files. Select all extracted files together and commit.
4. Let GitHub Actions/Pages finish. Open Study online on each family device
   once so every device receives the flat version before sharing new projects.
5. If the previous build remains visible, open the existing safe updater:
   https://dimitriyvolchenko.github.io/study/refresh.html

Do not delete existing repository files or folders. They can remain: the
updated app loads the flat filenames. The existing build workflow and its
sources remain in GitHub; they do not need to be uploaded again. The flat
course prefix and build marker are outside the generated regions and survive
that workflow. New flat course uploads are read by the app at startup; the
legacy workflow does not automatically embed newly added flat course files.

CHANGES
- packages/ files -> packages_*.json, including packages_index.json.
- bundled/ files -> bundled_*.json.
- icons/ files -> icons_icon-*.png.
- All package loading, upload and removal paths use the flat prefix.
- The install manifest uses the flat icons.
- A matching service worker caches the flat app and course files.
- New Sudak gallery files use study_sudak_* at the repository root.
  Legacy gallery records remain readable; existing photos are not moved.
- Progress keys and profile IDs remain unchanged; no progress files are included.

OPTIONAL COURSES
The two extra Expertology JSONs can be uploaded with all the other files, but
they are activated by importing in Study: Dad > Menu > Projects > Load project.
Choose STUDY_Pooh_Expertology_FULL.project.json (20 book lessons), or
SE2001_ALL_21_PACKS_ONE_IMPORT.json (the combined 21-pack course).

FILES_SHA256.json lists checksums. FLAT_FILE_MAP.json records the renames.
STUDY_UPLOAD_RULES.md records your requirement for all future Study packages.
These notes, maps and checksums are harmless if uploaded with the app.

VALIDATION
The companion VERIFICATION.txt records the checks run for this exact package.
