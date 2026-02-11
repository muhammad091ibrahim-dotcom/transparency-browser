const path = require('path');
const express = require('express');
const { chromium } = require('playwright');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const sessions = new Map();

const normalizeUrl = (value = '') => {
  const trimmed = value.trim();
  if (!trimmed) return 'https://www.google.com';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const withBaseTag = (html, currentUrl) => {
  if (!html.includes('<head')) {
    return `<base href="${currentUrl}">${html}`;
  }

  return html.replace(/<head([^>]*)>/i, `<head$1><base href="${currentUrl}">`);
};

const createSession = async ({ engine = 'playwright', headless = true }) => {
  const id = Math.random().toString(36).slice(2, 10);

  if (engine === 'puppeteer') {
    const browser = await puppeteer.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
    sessions.set(id, { id, engine, browser, page });
    return sessions.get(id);
  }

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
  sessions.set(id, { id, engine: 'playwright', browser, context, page });
  return sessions.get(id);
};

const getSession = (id) => sessions.get(id);

const closeSession = async (session) => {
  if (!session) return;
  await session.browser.close();
  sessions.delete(session.id);
};

const getPageHtml = async (session) => {
  const url = session.page.url();
  const html = await session.page.content();
  return withBaseTag(html, url);
};

app.post('/api/session', async (req, res) => {
  try {
    const engine = req.body.engine === 'puppeteer' ? 'puppeteer' : 'playwright';
    const headless = req.body.headless !== false;
    const session = await createSession({ engine, headless });

    res.json({
      sessionId: session.id,
      engine: session.engine,
      url: session.page.url(),
      title: await session.page.title(),
      html: await getPageHtml(session)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/session/:id/navigate', async (req, res) => {
  try {
    const session = getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const url = normalizeUrl(req.body.url);
    await session.page.goto(url, { waitUntil: 'domcontentloaded' });

    res.json({
      url: session.page.url(),
      title: await session.page.title(),
      html: await getPageHtml(session)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/session/:id/back', async (req, res) => {
  try {
    const session = getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await session.page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => null);
    res.json({
      url: session.page.url(),
      title: await session.page.title(),
      html: await getPageHtml(session)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/session/:id/forward', async (req, res) => {
  try {
    const session = getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await session.page.goForward({ waitUntil: 'domcontentloaded' }).catch(() => null);
    res.json({
      url: session.page.url(),
      title: await session.page.title(),
      html: await getPageHtml(session)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/session/:id/reload', async (req, res) => {
  try {
    const session = getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await session.page.reload({ waitUntil: 'domcontentloaded' });
    res.json({
      url: session.page.url(),
      title: await session.page.title(),
      html: await getPageHtml(session)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/session/:id', async (req, res) => {
  try {
    const session = getSession(req.params.id);
    if (!session) return res.status(204).send();

    await closeSession(session);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Transparency Browser running at http://localhost:${PORT}`);
});
