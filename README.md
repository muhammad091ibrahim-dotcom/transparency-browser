# Transparency Browser

A cloud-browser prototype with a **single HTML front-end** that looks similar to Chrome and a Node backend that can drive a real Chrome session using either:

- **Playwright (Chromium)**
- **Puppeteer (Chrome)**

## Features

- Chrome-like shell (tab strip, back/forward/reload, URL bar).
- "Transparency Browser" branding.
- Google as the default homepage in the cloud session.
- Backend-powered navigation actions (`navigate`, `back`, `forward`, `reload`).
- Session switching between Playwright and Puppeteer.
- Headless toggle for cloud session startup.

## Run

```bash
npm install
npm start
```

Then open <http://localhost:3000>.

## Notes

This is a prototype cloud-browser UI and backend bridge. The rendered page is returned as HTML and shown in an iframe (`srcdoc`) after each backend action.
