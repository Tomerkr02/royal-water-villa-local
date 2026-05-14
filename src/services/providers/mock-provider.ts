import { defaultDeviceStates, devices } from '../../data/devices';
import type { DeviceId, DeviceState, DeviceStateMap } from '../../types/device';
import type { ControlProvider } from '../../types/provider';

const STORAGE_KEY = 'royal-water-villa:device-states';

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

export class MockProvider implements ControlProvider {
  readonly name = 'MockProvider';

  async getDevices() {
    return {
      devices,
      states: readStates()
    };
  }

  async setDeviceState(deviceId: DeviceId, state: Partial<DeviceState>) {
    const states = readStates();
    states[deviceId] = { ...states[deviceId], ...state };
    writeStates(states);
    return states[deviceId];
  }

  async turnOffAll() {
    const states = readStates();
    const next = Object.fromEntries(
      Object.entries(states).map(([deviceId, state]) => [deviceId, { ...state, isOn: false }])
    ) as DeviceStateMap;
    writeStates(next);
    return next;
  }
}
