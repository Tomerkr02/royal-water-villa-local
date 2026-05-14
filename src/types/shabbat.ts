import type { DeviceArea, DeviceId } from './device';

export interface ShabbatDeviceSchedule {
  deviceId: DeviceId;
  area: DeviceArea;
  enabled: boolean;
  beforeShabbatOn: boolean;
  nightOffTime: string | null;
  morningOnTime: string | null;
  morningOffTime: string | null;
  motzeiOffTime: string | null;
}

export interface ShabbatState {
  isEnabled: boolean;
  candleLightingTime: string;
  motzeiShabbatTime: string;
  schedules: Record<DeviceId, ShabbatDeviceSchedule>;
}

export interface ShabbatActionPreview {
  deviceId: DeviceId;
  at: string;
  action: 'turnOn' | 'turnOff';
  reason: string;
}
