import type { ControlProvider } from '../types/provider';
import { CloudProvider } from './providers/cloud-provider';
import { MockProvider } from './providers/mock-provider';

export type ProviderName = 'cloud' | 'mock';

export const ACTIVE_PROVIDER: ProviderName = 'cloud';

export function createProvider(name: ProviderName = ACTIVE_PROVIDER): ControlProvider {
  if (name === 'cloud') {
    return new CloudProvider();
  }

  return new MockProvider();
}
