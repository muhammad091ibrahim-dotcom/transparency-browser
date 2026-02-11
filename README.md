# Transparency Browser (Single File)

This project now runs as **one standalone HTML file** using the `file://` protocol.

## Run

1. Open `public/index.html` directly in your browser (double click it or drag it into Chrome).
2. Use the URL bar to navigate or type search terms.

No server, Node.js, Puppeteer, or Playwright is required for this single-file mode.

## Important limitation

Some websites prevent being embedded in an `<iframe>` via `X-Frame-Options` or CSP. When that happens, open that site directly in a tab.
