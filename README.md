# Vlad Sedykh Portfolio

Static portfolio website designed for GitHub Pages deployment.

## Files

- `index.html` — one-page portfolio with hero, featured work, skills, and links to the gallery + game pages.
- `style.css` — shared styles for the portfolio and real estate pages.
- `real-estate.html` — separate real estate gallery layout with asset placeholders and expected filenames.
- `game.html` — page container for the canvas game.
- `game.css` — game page styling.
- `game.js` — vanilla JS game logic for **Dodge the Deadlines**.

## Run locally

Open `index.html` directly in a browser, or use a lightweight local server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Asset notes

For real estate media, place files in:

- `/assets/realestate/photo-01.jpg` through `/assets/realestate/photo-12.jpg`
- `/assets/realestate/video-01.mp4` through `/assets/realestate/video-06.mp4`
- `/assets/realestate/video-01.jpg` through `/assets/realestate/video-06.jpg` (posters)
