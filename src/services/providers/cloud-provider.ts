import { defaultDeviceStates, devices } from '../../data/devices';
import { tuyaDeviceMappings } from '../../config/device-mappings';
import type { DeviceId, DeviceState, DeviceStateMap } from '../../types/device';
import type { ControlProvider } from '../../types/provider';

const STORAGE_KEY = 'royal-water-villa:cloud-device-states';
const CONTROL_ENDPOINT = '/api/tuya/control';
const DEVICES_ENDPOINT = '/api/tuya/devices';

interface TuyaControlResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

interface TuyaStatusItem {
  code?: string;
  value?: unknown;
}

interface TuyaDevicePayload {
  id?: string;
  deviceId?: string;
  status?: TuyaStatusItem[] | Record<string, unknown>;
  online?: boolean;
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

function getLocalDeviceIdFromTuyaId(tuyaDeviceId: string, commandCode: string): DeviceId | null {
  const entry = Object.entries(tuyaDeviceMappings).find(([, mapping]) => {
    return mapping?.tuyaDeviceId === tuyaDeviceId && mapping.commandCode === commandCode;
  });
  return (entry?.[0] as DeviceId | undefined) ?? null;
}

function mergeTuyaStatuses(states: DeviceStateMap, payload: unknown): DeviceStateMap | null {
  const possibleDevices = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { devices?: unknown[] })?.devices)
      ? (payload as { devices: unknown[] }).devices
      : Array.isArray((payload as { result?: unknown[] })?.result)
        ? (payload as { result: unknown[] }).result
        : null;

  if (!possibleDevices) {
    return null;
  }

  let foundState = false;
  const next = { ...states };

  for (const rawDevice of possibleDevices) {
    const device = rawDevice as TuyaDevicePayload;
    const tuyaDeviceId = device.id ?? device.deviceId;
    if (!tuyaDeviceId || !device.status) {
      continue;
    }

    const statuses = Array.isArray(device.status)
      ? device.status
      : Object.entries(device.status).map(([code, value]) => ({ code, value }));

    for (const status of statuses) {
      if (typeof status.code !== 'string' || typeof status.value !== 'boolean') {
        continue;
      }

      const localDeviceId = getLocalDeviceIdFromTuyaId(tuyaDeviceId, status.code);
      if (!localDeviceId) {
        continue;
      }

      next[localDeviceId] = { ...next[localDeviceId], isOn: status.value };
      foundState = true;
    }
  }

  return foundState ? next : null;
}

async function fetchKnownDeviceStates(cachedStates: DeviceStateMap): Promise<DeviceStateMap | null> {
  try {
    const response = await fetch(DEVICES_ENDPOINT, { method: 'GET' });
    if (!response.ok) {
      console.info('[CloudProvider] getDevices state endpoint unavailable', { status: response.status });
      return null;
    }

    const payload = (await response.json()) as unknown;
    const mergedStates = mergeTuyaStatuses(cachedStates, payload);
    if (!mergedStates) {
      console.info('[CloudProvider] getDevices state response did not include readable switch states', { payload });
      return null;
    }

    writeStates(mergedStates);
    return mergedStates;
  } catch (error) {
    console.info('[CloudProvider] getDevices using cached state; state endpoint unavailable', { error });
    return null;
  }
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
}

export class CloudProvider implements ControlProvider {
  readonly name = 'CloudProvider';

  async getDevices() {
    console.info('[CloudProvider] getDevices');
    const cachedStates = readStates();
    const freshStates = await fetchKnownDeviceStates(cachedStates);
    return {
      devices,
      states: freshStates ?? cachedStates
    };
  }

  async setDeviceState(deviceId: DeviceId, state: Partial<DeviceState>) {
    const nextIsOn = Boolean(state.isOn);
    console.info('[CloudProvider] setDeviceState request', { deviceId, isOn: nextIsOn });
    try {
      await sendTuyaCommand(deviceId, nextIsOn);

      const states = readStates();
      states[deviceId] = { ...states[deviceId], ...state, isOn: nextIsOn };
      writeStates(states);
      console.info('[CloudProvider] setDeviceState success', { deviceId, isOn: nextIsOn });
      return states[deviceId];
    } catch (error) {
      console.error('[CloudProvider] setDeviceState failed', { deviceId, isOn: nextIsOn, error });
      throw error;
    }
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
