export type DeviceArea =
  | 'living'
  | 'outdoor'
  | 'pool'
  | 'bathroom'
  | 'bedroom';

export type DeviceKind = 'switch' | 'fan' | 'climate';

export type DeviceId =
  | 'wallLight'
  | 'pergolaLight'
  | 'livingRoomLedWall'
  | 'livingRoomCeilingSpots'
  | 'barLight'
  | 'poolLight'
  | 'rearPathLight'
  | 'outdoorWallLight'
  | 'bathroomLight'
  | 'ceilingFan'
  | 'ceilingFanLight'
  | 'bathroomHeater';

export type DeviceCapability = 'onOff' | 'speed' | 'hvacMode';

export interface BaseDevice {
  id: DeviceId;
  name: string;
  area: DeviceArea;
  kind: DeviceKind;
  capabilities: DeviceCapability[];
}

export interface SwitchDevice extends BaseDevice {
  kind: 'switch';
  capabilities: ['onOff'];
}

export interface FanDevice extends BaseDevice {
  id: 'ceilingFan';
  kind: 'fan';
  capabilities: ['onOff', 'speed'];
  supportedSpeeds: readonly [1, 2, 3];
}

export interface ClimateDevice extends BaseDevice {
  id: 'bathroomHeater';
  kind: 'climate';
  capabilities: ['onOff', 'hvacMode'];
}

export type Device = SwitchDevice | FanDevice | ClimateDevice;

export interface DeviceState {
  isOn: boolean;
  isAvailable?: boolean;
  speed?: 1 | 2 | 3;
  percentage?: number;
  hvacMode?: string;
}

export type DeviceStateMap = Record<DeviceId, DeviceState>;
