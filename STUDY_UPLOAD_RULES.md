# Study upload rule — user preference

The user requires every future Study GitHub upload ZIP to be completely flat.
All entries must be files directly at the ZIP root, with no subfolders and no
outer wrapper directory. The user cannot preserve folders during manual upload.

Adjust all affected file references, manifests, service-worker caches and
application read/write paths to the flat filenames. Do not simply remove folder
names from the archive. Preserve course IDs and progress storage keys. Check
compatibility with the existing GitHub build workflow.

Upload a separately named ZIP to the user's Google Drive downloads Google folder.
Do not push changes to GitHub unless the user separately requests it. Exclude
progress*.json from deployment packages. Keep optional course imports explicit.

Confirmed by the user on 17 November 2026.
