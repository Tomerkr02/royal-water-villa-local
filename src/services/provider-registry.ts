import type { ControlProvider } from '../types/provider';
import { CloudProvider } from './providers/cloud-provider';
import { HomeAssistantProvider } from './providers/home-assistant-provider';
import { MockProvider } from './providers/mock-provider';

export type ProviderName = 'tuya' | 'home-assistant' | 'cloud' | 'mock';

function getConfiguredProvider(): ProviderName {
  const configuredProvider = import.meta.env.VITE_DEVICE_PROVIDER;

  if (configuredProvider === 'home-assistant' || configuredProvider === 'cloud' || configuredProvider === 'mock') {
    return configuredProvider;
  }

  return 'tuya';
}

export const ACTIVE_PROVIDER: ProviderName = getConfiguredProvider();

export function createProvider(name: ProviderName = ACTIVE_PROVIDER): ControlProvider {
  if (name === 'home-assistant') {
    return new HomeAssistantProvider();
  }

  if (name === 'tuya' || name === 'cloud') {
    return new CloudProvider();
  }

  return new MockProvider();
}
