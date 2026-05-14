import type { Device, DeviceId, DeviceState, DeviceStateMap } from './device';

export interface ControlProvider {
  readonly name: string;
  getDevices(): Promise<{ devices: Device[]; states: DeviceStateMap }>;
  setDeviceState(deviceId: DeviceId, state: Partial<DeviceState>): Promise<DeviceState>;
  turnOffAll(): Promise<DeviceStateMap>;
}
