# Client-Side Tetris

A fully client-side Tetris game rendered on HTML canvas with vanilla JavaScript. No build step or server logic required.

## Run locally

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

## Deploy (static hosting)

Upload the following static files to any static host:

- `index.html`
- `style.css`
- `script.js`
- `INSTRUCTIONS.md`

That is all you need to run the game.

## Deploy with GitHub Pages

1. In your GitHub repository, go to **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions**.
3. Push to the `main` branch (or your default branch). The workflow in `.github/workflows/pages.yml` will publish the site.
4. Once the workflow completes, your game will be available at the Pages URL shown in **Settings → Pages**.
