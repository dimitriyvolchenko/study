# Study v014 test notes

Build: `Study v014 · 29.10.2026 · Exact W source + templates`

## Implemented changes
- Reworked W tab.
- Switched the main W wallpaper source from the generic internal template to the user's exact attached clean Walkman wallpaper file.
- Added a thumbnail template gallery inside the W tab.
- Added template selection state persistence.
- Added recreated retro wallpaper assets in iPhone 15 Pro Max proportion:
  - Walkman variants
  - Nokia-style variants
  - Retro/Kodak-style variants
- Kept W1 / W2 generation logic.
- Added per-template placement zones for generated word blocks.
- Updated build labels from v013 to v014.

## Reference grounding
- Dribbble pages were checked successfully.
- The Walkman page states the series includes classic yellow Sports Walkman variations and recolored interpretations.
- The Nokia 3310 page explicitly notes high-resolution wallpapers at 2358x5112 px.
- The Retro Wallpaper Pack page describes a collection of retro-inspired wallpapers.

## Validation performed
- Verified that the exact attached clean Walkman file is available in the environment and used as the main source.
- Generated a local asset pack under `Study_v014/assets`.
- Verified the new W module parses successfully as JavaScript.
- Verified the updated build/version strings in `index.html`.
- Verified the new template gallery markup and template metadata insertion.

## Files to deploy
- `index.html`
- `refresh.html`
- `assets/` directory


## Flat archive variant
- Created a special flat build with no assets directory.
- All wallpaper PNG files were moved next to index.html.
- All `assets/...` references in `index.html` were rewritten to plain filenames.
- This build is intended for GitHub uploads where files are copied in bulk without preserving folders.


## v015 wallpaper update
- Reworked W with improved text placement.
- Added a dedicated Download button under Preview.
- Kept Force update the app in the build.
- Removed the weak custom wallpaper options from the W selector.
- Added original templates provided by the user: Walkman Sports, Sony Beta L-500, iPod black, and iPod red.
- Versioned wallpaper assets with `v015_` filenames so old repository files should not interfere.
