import type { ControlProvider } from '../types/provider';
import { CloudProvider } from './providers/cloud-provider';
import { HomeAssistantProvider } from './providers/home-assistant-provider';
import { MockProvider } from './providers/mock-provider';

export type ProviderName = 'home-assistant' | 'cloud' | 'mock';

export const ACTIVE_PROVIDER: ProviderName = 'home-assistant';

export function createProvider(name: ProviderName = ACTIVE_PROVIDER): ControlProvider {
  if (name === 'home-assistant') {
    return new HomeAssistantProvider();
  }

  if (name === 'cloud') {
    return new CloudProvider();
  }

  return new MockProvider();
}
