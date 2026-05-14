import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM_DEVICE_ACCESS_ENDPOINT = 'https://royal-water-villa-system.vercel.app/api/tuya/device-access';

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

  const deviceId = Array.isArray(request.query.deviceId) ? request.query.deviceId[0] : request.query.deviceId;
  if (!deviceId) {
    response.status(400).json({ success: false, error: 'Missing deviceId' });
    return;
  }

  try {
    const upstreamUrl = `${UPSTREAM_DEVICE_ACCESS_ENDPOINT}?deviceId=${encodeURIComponent(deviceId)}`;
    const upstreamResponse = await fetch(upstreamUrl);
    const text = await upstreamResponse.text();
    const payload = text ? JSON.parse(text) : {};
    response.status(upstreamResponse.status).json(payload);
  } catch (error) {
    console.error('[Tuya Device Access Proxy] upstream request failed', error);
    response.status(502).json({ success: false, error: 'Tuya device access upstream request failed' });
  }
}
