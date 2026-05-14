import { defaultDeviceStates, devices } from '../../data/devices';
import { tuyaDeviceMappings } from '../../config/device-mappings';
import type { DeviceId, DeviceState, DeviceStateMap } from '../../types/device';
import type { ControlProvider } from '../../types/provider';

const STORAGE_KEY = 'royal-water-villa:cloud-device-states';
const CONTROL_ENDPOINT = '/api/tuya/control';
const DEVICE_ACCESS_ENDPOINT = '/api/tuya/device-access';

interface TuyaControlResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

interface TuyaStatusItem {
  code?: string;
  value?: unknown;
}

interface TuyaDeviceAccessResponse {
  success?: boolean;
  deviceId?: string;
  result?: {
    status?: TuyaStatusItem[];
  };
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

async function fetchKnownDeviceStates(cachedStates: DeviceStateMap): Promise<DeviceStateMap | null> {
  console.info('[CloudProvider] polling devices');
  const next = { ...cachedStates };
  let syncedAnyDevice = false;

  try {
    const mappingsByTuyaDevice = Object.entries(tuyaDeviceMappings).reduce(
      (groups, [localDeviceId, mapping]) => {
        if (!mapping) {
          return groups;
        }
        groups[mapping.tuyaDeviceId] = [
          ...(groups[mapping.tuyaDeviceId] ?? []),
          { localDeviceId: localDeviceId as DeviceId, commandCode: mapping.commandCode }
        ];
        return groups;
      },
      {} as Record<string, Array<{ localDeviceId: DeviceId; commandCode: string }>>
    );

    await Promise.all(
      Object.entries(mappingsByTuyaDevice).map(async ([tuyaDeviceId, localMappings]) => {
        const response = await fetch(`${DEVICE_ACCESS_ENDPOINT}?deviceId=${encodeURIComponent(tuyaDeviceId)}`, {
          method: 'GET'
        });

        if (!response.ok) {
          throw new Error(`Device access failed for ${tuyaDeviceId}: ${response.status}`);
        }

        const payload = (await response.json()) as TuyaDeviceAccessResponse;
        const statuses = payload.result?.status ?? [];

        for (const mapping of localMappings) {
          const status = statuses.find((item) => item.code === mapping.commandCode);
          if (typeof status?.value !== 'boolean') {
            continue;
          }

          next[mapping.localDeviceId] = { ...next[mapping.localDeviceId], isOn: status.value };
          syncedAnyDevice = true;
          console.info('[CloudProvider] device synced', {
            deviceId: mapping.localDeviceId,
            tuyaDeviceId,
            commandCode: mapping.commandCode,
            isOn: status.value
          });
        }
      })
    );

    if (syncedAnyDevice) {
      writeStates(next);
      return next;
    }

    return null;
  } catch (error) {
    console.error('[CloudProvider] polling failed', { error });
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
