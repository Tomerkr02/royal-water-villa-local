import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM_CONTROL_ENDPOINT = 'https://royal-water-villa-system.vercel.app/api/tuya/control';

interface TuyaCommand {
  code: string;
  value: boolean | number | string;
}

interface TuyaControlRequestBody {
  deviceId?: unknown;
  commands?: unknown;
}

function isTuyaCommand(command: unknown): command is TuyaCommand {
  if (!command || typeof command !== 'object') {
    return false;
  }

  const candidate = command as Partial<TuyaCommand>;
  const valueType = typeof candidate.value;
  return (
    typeof candidate.code === 'string' &&
    (valueType === 'boolean' || valueType === 'number' || valueType === 'string')
  );
}

function isValidBody(body: TuyaControlRequestBody): body is { deviceId: string; commands: TuyaCommand[] } {
  return typeof body.deviceId === 'string' && Array.isArray(body.commands) && body.commands.every(isTuyaCommand);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  if (!isValidBody(request.body as TuyaControlRequestBody)) {
    response.status(400).json({ success: false, error: 'Invalid Tuya control request body' });
    return;
  }

  try {
    const upstreamResponse = await fetch(UPSTREAM_CONTROL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.body)
    });

    const text = await upstreamResponse.text();
    const payload = text ? JSON.parse(text) : {};
    response.status(upstreamResponse.status).json(payload);
  } catch (error) {
    console.error('[Tuya Proxy] upstream request failed', error);
    response.status(502).json({ success: false, error: 'Tuya upstream request failed' });
  }
}
