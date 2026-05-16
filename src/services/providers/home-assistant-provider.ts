import { homeAssistantDeviceMappings } from '../../config/home-assistant-mappings';
import { defaultDeviceStates, devices } from '../../data/devices';
import type { DeviceId, DeviceState, DeviceStateMap } from '../../types/device';
import type { HomeAssistantServiceResponse, HomeAssistantState } from '../../types/home-assistant';
import type { ControlProvider } from '../../types/provider';
import { CloudProvider } from './cloud-provider';

const STORAGE_KEY = 'royal-water-villa:home-assistant-device-states';

function readStates(): DeviceStateMap {
  if (typeof localStorage === 'undefined') {
    return structuredClone(defaultDeviceStates);
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultDeviceStates, ...JSON.parse(stored) } : structuredClone(defaultDeviceStates);
  } catch {
    return structuredClone(defaultDeviceStates);
  }
}

function writeStates(states: DeviceStateMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

async function requestHomeAssistantService(endpoint: 'turn-on' | 'turn-off' | 'toggle', entityId: string) {
  console.info('[HomeAssistantProvider] service request', { endpoint, entityId });
  const response = await fetch(`/api/home-assistant/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entityId })
  });

  const payload = (await response.json()) as HomeAssistantServiceResponse;
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error ?? `Home Assistant ${endpoint} failed with ${response.status}`);
  }

  console.info('[HomeAssistantProvider] service success', { endpoint, entityId, payload });
}

export class HomeAssistantProvider implements ControlProvider {
  readonly name = 'HomeAssistantProvider';
  private readonly fallback = new CloudProvider();

  async getDevices() {
    console.info('[HomeAssistantProvider] getDevices');
    const cachedStates = readStates();

    try {
      const response = await fetch('/api/home-assistant/states');
      if (!response.ok) {
        throw new Error(`Home Assistant states failed with ${response.status}`);
      }

      const homeAssistantStates = (await response.json()) as HomeAssistantState[];
      const next = { ...cachedStates };

      for (const [deviceId, mapping] of Object.entries(homeAssistantDeviceMappings)) {
        if (!mapping) {
          continue;
        }

        const state = homeAssistantStates.find((item) => item.entity_id === mapping.entityId);
        if (!state) {
          continue;
        }

        next[deviceId as DeviceId] = {
          ...next[deviceId as DeviceId],
          isOn: state.state === 'on'
        };
        console.info('[HomeAssistantProvider] device synced', {
          deviceId,
          entityId: mapping.entityId,
          state: state.state
        });
      }

      writeStates(next);
      return { devices, states: next, localSystemOnline: true };
    } catch (error) {
      console.error('[HomeAssistantProvider] getDevices failed; using Tuya fallback', { error });
      const fallbackResult = await this.fallback.getDevices();
      return { ...fallbackResult, localSystemOnline: false };
    }
  }

  async setDeviceState(deviceId: DeviceId, state: Partial<DeviceState>) {
    const mapping = homeAssistantDeviceMappings[deviceId];
    const nextIsOn = Boolean(state.isOn);

    if (!mapping) {
      console.info('[HomeAssistantProvider] missing HA mapping; using Tuya fallback', { deviceId });
      return this.fallback.setDeviceState(deviceId, state);
    }

    try {
      await requestHomeAssistantService(nextIsOn ? 'turn-on' : 'turn-off', mapping.entityId);
      const states = readStates();
      states[deviceId] = { ...states[deviceId], ...state, isOn: nextIsOn };
      writeStates(states);
      return states[deviceId];
    } catch (error) {
      console.error('[HomeAssistantProvider] command failed; using Tuya fallback', { deviceId, error });
      return this.fallback.setDeviceState(deviceId, state);
    }
  }

  async turnOffAll() {
    const states = readStates();
    const next = { ...states };

    for (const device of devices) {
      const mapping = homeAssistantDeviceMappings[device.id];
      if (!mapping) {
        continue;
      }

      try {
        await requestHomeAssistantService('turn-off', mapping.entityId);
        next[device.id] = { ...next[device.id], isOn: false };
      } catch (error) {
        console.error('[HomeAssistantProvider] turnOffAll failed for device', { deviceId: device.id, error });
      }
    }

    const fallbackStates = await this.fallback.turnOffAll();
    writeStates({ ...fallbackStates, ...next });
    return { ...fallbackStates, ...next };
  }
}
