import { defaultDeviceStates, devices } from '../../data/devices';
import { tuyaDeviceMappings } from '../../config/device-mappings';
import type { DeviceId, DeviceState, DeviceStateMap } from '../../types/device';
import type { ControlProvider } from '../../types/provider';

const STORAGE_KEY = 'royal-water-villa:cloud-device-states';
const CONTROL_ENDPOINT = 'https://royal-water-villa-system.vercel.app/api/tuya/control';

interface TuyaControlResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

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

async function sendTuyaCommand(deviceId: DeviceId, value: boolean | number | string) {
  const mapping = tuyaDeviceMappings[deviceId];
  if (!mapping) {
    const message = `Missing Tuya mapping for ${deviceId}`;
    console.error('[CloudProvider] command failed', { deviceId, error: message });
    throw new Error(message);
  }

  const body = {
    deviceId: mapping.tuyaDeviceId,
    commands: [
      {
        code: mapping.commandCode,
        value
      }
    ]
  };

  console.info('[CloudProvider] sending command', { deviceId, body });

  const response = await fetch(CONTROL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  let payload: TuyaControlResponse | null = null;
  try {
    payload = (await response.json()) as TuyaControlResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const message = payload?.error ?? payload?.message ?? `Tuya control failed with ${response.status}`;
    console.error('[CloudProvider] command failed', { deviceId, status: response.status, payload });
    throw new Error(message);
  }

  console.info('[CloudProvider] command succeeded', { deviceId, payload });
}

export class CloudProvider implements ControlProvider {
  readonly name = 'CloudProvider';

  async getDevices() {
    return {
      devices,
      states: readStates()
    };
  }

  async setDeviceState(deviceId: DeviceId, state: Partial<DeviceState>) {
    const nextIsOn = Boolean(state.isOn);
    await sendTuyaCommand(deviceId, nextIsOn);

    const states = readStates();
    states[deviceId] = { ...states[deviceId], ...state, isOn: nextIsOn };
    writeStates(states);
    return states[deviceId];
  }

  async turnOffAll() {
    const states = readStates();
    const next = { ...states };

    for (const device of devices) {
      try {
        await sendTuyaCommand(device.id, false);
        next[device.id] = { ...next[device.id], isOn: false };
      } catch (error) {
        console.error('[CloudProvider] turnOffAll device failed', { deviceId: device.id, error });
      }
    }

    writeStates(next);
    return next;
  }
}
