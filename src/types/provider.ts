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
  setFanPercentage?(deviceId: DeviceId, percentage: number): Promise<DeviceState>;
  setClimatePower?(deviceId: DeviceId, isOn: boolean): Promise<DeviceState>;
  setClimateHvacMode?(deviceId: DeviceId, hvacMode: string): Promise<DeviceState>;
  turnOffAll(): Promise<DeviceStateMap>;
}
