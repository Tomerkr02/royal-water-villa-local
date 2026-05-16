import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PORT = Number(process.env.LOCAL_API_PORT ?? 8787);
const REQUEST_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 500;

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const index = trimmed.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    process.env[key] = process.env[key] ?? value;
  }
}

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
      console.info('[HA Bridge] request', { path, method: init.method ?? 'GET', attempt: attempt + 1 });
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
      console.error('[HA Bridge] request failed', { path, attempt: attempt + 1, error });
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

async function sendUpstream(response, upstream) {
  const text = await upstream.text();
  response.writeHead(upstream.status, { 'Content-Type': 'application/json' });
  response.end(text || '{}');
}

loadEnvLocal();

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  try {
    if (request.method === 'GET' && url.pathname === '/api/home-assistant/states') {
      const upstream = await requestHomeAssistant('/api/states');
      await sendUpstream(response, upstream);
      return;
    }

    const serviceMatch = url.pathname.match(/^\/api\/home-assistant\/(turn-on|turn-off|toggle)$/);
    if (request.method === 'POST' && serviceMatch) {
      const body = await readBody(request);
      const entityId = body.entityId;
      const domain = body.domain;
      if (!entityId || typeof entityId !== 'string' || !domain || typeof domain !== 'string') {
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: false, error: 'Missing entityId or domain' }));
        return;
      }

      const defaultService = serviceMatch[1].replace('-', '_');
      const service = typeof body.service === 'string' ? body.service : defaultService;
      const upstream = await requestHomeAssistant(`/api/services/${domain}/${service}`, {
        method: 'POST',
        body: JSON.stringify({ entity_id: entityId })
      });
      await sendUpstream(response, upstream);
      return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ success: false, error: 'Not found' }));
  } catch (error) {
    console.error('[HA Bridge] handler failed', error);
    response.writeHead(502, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ success: false, error: 'Home Assistant bridge request failed' }));
  }
}).listen(PORT, '127.0.0.1', () => {
  console.info(`[HA Bridge] listening on http://127.0.0.1:${PORT}`);
});
