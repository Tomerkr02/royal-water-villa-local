const REQUEST_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 500;

export interface HomeAssistantProxyConfig {
  baseUrl: string;
  token: string;
}

export function getHomeAssistantConfig(): HomeAssistantProxyConfig {
  const baseUrl = process.env.HOME_ASSISTANT_BASE_URL;
  const token = process.env.HOME_ASSISTANT_TOKEN;

  if (!baseUrl || !token) {
    throw new Error('Missing HOME_ASSISTANT_BASE_URL or HOME_ASSISTANT_TOKEN');
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    token
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestHomeAssistant(path: string, init: RequestInit = {}) {
  const config = getHomeAssistantConfig();
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      console.info('[HomeAssistant API] request', { path, method: init.method ?? 'GET', attempt: attempt + 1 });
      const response = await fetch(`${config.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
          ...(init.headers ?? {})
        }
      });

      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      console.error('[HomeAssistant API] request failed', { path, attempt: attempt + 1, error });
      if (attempt === 0) {
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
}

export async function readJsonResponse(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}
