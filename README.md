# port
New Portfolio Attempt 

Static site, no build step. Deployed from `main` via GitHub Pages at https://vladesque.github.io/port/.

## Layout

- `base.css` — tokens, reset, ambient background, nav (desktop + mobile drawer), focus styles, cursor, reduced motion. Loaded by every page.
- `styles.css` — home page only. `subpage-theme.css` — every other page. `pitch-deck.css` — the pitch deck.
- `nav.js` — mobile menu; `cursor.js`, `transitions.js`, `work-grid.js` — progressive enhancements.
- Photos live in `assets/img/` as JPEG + WebP pairs; work-card posters/loops in `assets/work/<page>/`.

## Adding a page

1. Copy an existing subpage (e.g. `real-estate.html`) and keep the `<head>` block, skip link, and `<nav class="site-nav">` markup intact — `nav.js` and `base.css` depend on that structure.
2. Add the page to the Work dropdown in **every** HTML file, to `sitemap.xml`, and to the work grid on `index.html`.
3. Run `python3 -m http.server` and check it at phone width; the nav collapses to a drawer below 900px.
