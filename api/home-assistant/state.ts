import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonResponse, requestHomeAssistant } from './_client';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const entityId = typeof request.query.entity_id === 'string' ? request.query.entity_id : '';
  if (!entityId) {
    response.status(400).json({ success: false, error: 'Missing entity_id' });
    return;
  }

  try {
    const upstream = await requestHomeAssistant(`/api/states/${encodeURIComponent(entityId)}`);
    response.status(upstream.status).json(await readJsonResponse(upstream));
  } catch (error) {
    console.error('[HomeAssistant API] single state failed', error);
    response.status(502).json({ success: false, error: 'Home Assistant state request failed' });
  }
}
