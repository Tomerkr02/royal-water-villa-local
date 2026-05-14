import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM_DEVICES_ENDPOINT = 'https://royal-water-villa-system.vercel.app/api/tuya/devices';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'GET') {
    response.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const upstreamResponse = await fetch(UPSTREAM_DEVICES_ENDPOINT);
    const text = await upstreamResponse.text();
    const payload = text ? JSON.parse(text) : {};
    response.status(upstreamResponse.status).json(payload);
  } catch (error) {
    console.error('[Tuya Devices Proxy] upstream request failed', error);
    response.status(502).json({ success: false, error: 'Tuya devices upstream request failed' });
  }
}
