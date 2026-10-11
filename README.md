# Hsing-Yu Wen — Personal Website

A responsive, static portfolio site built with semantic HTML, modern CSS, and dependency-free JavaScript.

## Preview locally

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Deploy

The site has no build step. Deploy the repository root directly to GitHub Pages, Netlify, or Vercel.

## Structure

- `index.html` — page structure and portfolio content
- `styles.css` — visual system, responsive layouts, and the motion layer (bottom of file)
- `script.js` — navigation, intro loader, hero canvas, custom cursor, scroll effects, and project visuals
- `assets/` — logos, headshot, and résumé PDF

## Motion

All animation is hand-written CSS and vanilla JS (no libraries):

- Intro loader (plays once per browser session)
- Split-word hero headline and typewriter role rotator
- Cursor-reactive dot field on a `<canvas>` (paused when off-screen)
- Scroll progress bar, auto-hiding header, masked section headings, count-up metrics
- Timeline rail that fills as you scroll
- Animated project visuals: typed SQL query, Kafka stream, PageRank graph, clustering
- Custom cursor, magnetic buttons, and 3D tilt on fine-pointer devices only

Everything respects `prefers-reduced-motion: reduce` — those visitors get a static version.
