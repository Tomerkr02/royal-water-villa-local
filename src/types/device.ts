export type DeviceArea =
  | 'living'
  | 'outdoor'
  | 'pool'
  | 'bathroom'
  | 'bedroom';

export type DeviceKind = 'switch' | 'fan';

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

export type DeviceCapability = 'onOff' | 'speed';

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

export type Device = SwitchDevice | FanDevice;

export interface DeviceState {
  isOn: boolean;
  isAvailable?: boolean;
  speed?: 1 | 2 | 3;
}

export type DeviceStateMap = Record<DeviceId, DeviceState>;
