/*
 * Recipe import helper for Recipe Studio (allisonchen.us/recipe-studio/).
 *
 * GET /api/fetch?url=<recipe page>
 * Fetches a public recipe page from the server side (recipe sites usually block
 * the shared public proxies Recipe Studio would otherwise use) and returns its
 * HTML. Recipe Studio reads the recipe data out of that HTML in the browser.
 *
 * Locked down so it is not an open proxy: it only answers browsers on the
 * origins below, only fetches public http(s) pages by host name, and caps
 * time and size.
 */
'use strict';

const ALLOWED_ORIGINS = new Set([
  'https://allisonchen.us',
  'https://www.allisonchen.us',
  'https://allisonchen23.github.io',
  'http://localhost:4000',
  'http://127.0.0.1:4000'
]);
const TIMEOUT_MS = 10000;
const MAX_BYTES = 5 * 1024 * 1024;

function blockedHost(hostname) {
  const h = hostname.toLowerCase().replace(/\.$/, '');
  if (!h.includes('.')) return true;                       // "localhost", bare names
  if (/\.(local|localhost|internal|lan|home|corp)$/.test(h)) return true;
  if (/^\[.*\]$/.test(h) || h.includes(':')) return true;  // IPv6 literal
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return true;      // IPv4 literal
  return false;
}

function send(res, status, body, origin, type) {
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.statusCode = status;
  if (type === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(body);
  } else {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
  }
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (!ALLOWED_ORIGINS.has(origin)) {
    return send(res, 403, { error: 'This service only works from Recipe Studio.' });
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    return send(res, 204, '', origin, 'html');
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'Use GET.' }, origin);

  let target;
  try {
    const raw = new URL(req.url, 'http://local').searchParams.get('url') || '';
    target = new URL(raw);
  } catch (e) {
    return send(res, 400, { error: 'Missing or invalid url.' }, origin);
  }
  if (!/^https?:$/.test(target.protocol) || target.username || target.password ||
      (target.port && !['80', '443'].includes(target.port)) || blockedHost(target.hostname)) {
    return send(res, 400, { error: 'Only public web pages can be imported.' }, origin);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(target.href, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    // a redirect must not lead somewhere we would have refused
    const finalUrl = new URL(upstream.url || target.href);
    if (blockedHost(finalUrl.hostname)) {
      return send(res, 400, { error: 'Only public web pages can be imported.' }, origin);
    }
    if (!upstream.ok) {
      return send(res, 502, { error: 'The recipe site answered with an error.', status: upstream.status }, origin);
    }
    const len = Number(upstream.headers.get('content-length') || 0);
    if (len > MAX_BYTES) return send(res, 413, { error: 'That page is too large.' }, origin);
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length > MAX_BYTES) return send(res, 413, { error: 'That page is too large.' }, origin);
    return send(res, 200, buf.toString('utf8'), origin, 'html');
  } catch (e) {
    const timedOut = e && e.name === 'AbortError';
    return send(res, 504, { error: timedOut ? 'The recipe site took too long to answer.' : 'Could not reach the recipe site.' }, origin);
  } finally {
    clearTimeout(timer);
  }
};

module.exports.blockedHost = blockedHost;
