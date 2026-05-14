import { devices } from './devices';
import type { DeviceId } from '../types/device';
import type { ShabbatDeviceSchedule } from '../types/shabbat';

const allShabbat: DeviceId[] = [
  'bathroomLight',
  'outdoorWallLight',
  'wallLight',
  'pergolaLight',
  'rearPathLight'
];

const midnightOff: DeviceId[] = [
  'poolLight',
  'ceilingFanLight',
  'livingRoomLedWall',
  'livingRoomCeilingSpots',
  'barLight'
];

export const defaultShabbatSchedules = devices.reduce((schedules, device) => {
  const enabled = allShabbat.includes(device.id) || midnightOff.includes(device.id);
  schedules[device.id] = {
    deviceId: device.id,
    area: device.area,
    enabled,
    beforeShabbatOn: enabled,
    nightOffTime: midnightOff.includes(device.id) ? '00:00' : null,
    morningOnTime: null,
    morningOffTime: null,
    motzeiOffTime: enabled ? '20:30' : null
  };
  return schedules;
}, {} as Record<DeviceId, ShabbatDeviceSchedule>);
