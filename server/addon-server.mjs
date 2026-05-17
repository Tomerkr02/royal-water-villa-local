import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';
const DIST_DIR = resolve(process.cwd(), 'dist');
const REQUEST_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 500;

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function requestHomeAssistant(path, init = {}) {
  const baseUrl = process.env.HOME_ASSISTANT_BASE_URL?.replace(/\/$/, '');
  const token = process.env.HOME_ASSISTANT_TOKEN;

  if (!baseUrl || !token) {
    throw new Error('Missing HOME_ASSISTANT_BASE_URL or HOME_ASSISTANT_TOKEN');
  }

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      console.info('[Royal Water Villa Add-on] HA request', { path, method: init.method ?? 'GET', attempt: attempt + 1 });
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(init.headers ?? {})
        }
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      console.error('[Royal Water Villa Add-on] HA request failed', { path, attempt: attempt + 1, error });
      if (attempt === 0) {
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
}

function readBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      try {
        resolveBody(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

async function sendJsonResponse(response, upstream) {
  const text = await upstream.text();
  response.writeHead(upstream.status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(text || '{}');
}

async function handleHomeAssistantApi(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/home-assistant/states') {
    const upstream = await requestHomeAssistant('/api/states');
    await sendJsonResponse(response, upstream);
    return true;
  }

  if (request.method === 'GET' && url.pathname === '/api/home-assistant/state') {
    const entityId = url.searchParams.get('entity_id');
    if (!entityId) {
      response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ success: false, error: 'Missing entity_id' }));
      return true;
    }

    const upstream = await requestHomeAssistant(`/api/states/${encodeURIComponent(entityId)}`);
    await sendJsonResponse(response, upstream);
    return true;
  }

  const serviceMatch = url.pathname.match(/^\/api\/home-assistant\/(turn-on|turn-off|toggle)$/);
  if (request.method === 'POST' && serviceMatch) {
    const body = await readBody(request);
    const entityId = body.entityId;
    const domain = body.domain;

    if (!entityId || typeof entityId !== 'string' || !domain || typeof domain !== 'string') {
      response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ success: false, error: 'Missing entityId or domain' }));
      return true;
    }

    const defaultService = serviceMatch[1].replace('-', '_');
    const service = typeof body.service === 'string' ? body.service : defaultService;
    const upstream = await requestHomeAssistant(`/api/services/${domain}/${service}`, {
      method: 'POST',
      body: JSON.stringify({ entity_id: entityId, ...(body.serviceData ?? {}) })
    });
    await sendJsonResponse(response, upstream);
    return true;
  }

  return false;
}

function serveStatic(response, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const normalizedPath = requestedPath.replace(/^\/+/, '');
  const filePath = resolve(DIST_DIR, normalizedPath);
  const safeDist = `${DIST_DIR}${process.platform === 'win32' ? '\\' : '/'}`;
  const isSafePath = filePath === DIST_DIR || filePath.startsWith(safeDist);
  const finalPath = isSafePath && existsSync(filePath) ? filePath : join(DIST_DIR, 'index.html');
  const extension = extname(finalPath);

  response.writeHead(200, {
    'Cache-Control': finalPath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    'Content-Type': CONTENT_TYPES[extension] ?? 'application/octet-stream'
  });
  response.end(readFileSync(finalPath));
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  try {
    if (url.pathname.startsWith('/api/home-assistant/')) {
      const handled = await handleHomeAssistantApi(request, response, url);
      if (handled) {
        return;
      }
    }

    serveStatic(response, url.pathname);
  } catch (error) {
    console.error('[Royal Water Villa Add-on] request failed', error);
    response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ success: false, error: 'Royal Water Villa add-on request failed' }));
  }
}).listen(PORT, HOST, () => {
  console.info(`[Royal Water Villa Add-on] listening on http://${HOST}:${PORT}`);
  console.info(`[Royal Water Villa Add-on] Home Assistant target: ${process.env.HOME_ASSISTANT_BASE_URL ?? 'not configured'}`);
});
