import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonResponse, requestHomeAssistant } from './_client';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const upstream = await requestHomeAssistant('/api/states');
    response.status(upstream.status).json(await readJsonResponse(upstream));
  } catch (error) {
    console.error('[HomeAssistant API] states failed', error);
    response.status(502).json({ success: false, error: 'Home Assistant states request failed' });
  }
}
