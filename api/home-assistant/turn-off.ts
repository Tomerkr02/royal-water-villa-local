import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonResponse, requestHomeAssistant } from './_client';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { entityId, domain, service, serviceData } = request.body as {
      entityId?: string;
      domain?: string;
      service?: string;
      serviceData?: Record<string, unknown>;
    };
    if (!entityId || !domain) {
      response.status(400).json({ success: false, error: 'Missing entityId or domain' });
      return;
    }

    const upstream = await requestHomeAssistant(`/api/services/${domain}/${service ?? 'turn_off'}`, {
      method: 'POST',
      body: JSON.stringify({ entity_id: entityId, ...(serviceData ?? {}) })
    });
    response.status(upstream.status).json(await readJsonResponse(upstream));
  } catch (error) {
    console.error('[HomeAssistant API] turn-off failed', error);
    response.status(502).json({ success: false, error: 'Home Assistant turn-off request failed' });
  }
}
