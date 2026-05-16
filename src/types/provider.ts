import type { Device, DeviceId, DeviceState, DeviceStateMap } from './device';
import type { HomeAssistantDebugEntity } from './home-assistant';

export interface ControlProvider {
  readonly name: string;
  getDevices(): Promise<{
    devices: Device[];
    states: DeviceStateMap;
    localSystemOnline?: boolean;
    localSystemError?: string | null;
    homeAssistantEntities?: HomeAssistantDebugEntity[];
  }>;
  setDeviceState(deviceId: DeviceId, state: Partial<DeviceState>): Promise<DeviceState>;
  turnOffAll(): Promise<DeviceStateMap>;
}
